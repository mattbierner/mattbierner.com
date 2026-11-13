#!/usr/bin/env ruby
# Cross-file checks for _data/ that JSON Schema can't express. Run through
# tools/validate-data.sh, which validates the schemas first.
#
# Errors: a category points at a missing file; local media doesn't exist.
# Warnings: entries not newest first; unlisted category files; duplicate titles.

require "yaml"
require "date"

Encoding.default_external = Encoding::UTF_8
Dir.chdir(File.expand_path("..", __dir__))

def load(path)
  YAML.safe_load(File.read(path), permitted_classes: [Date])
end

errors = []
warnings = []
titles = Hash.new { |h, k| h[k] = [] }
listed = []

load("_data/projects.yml").fetch("categories").each do |category|
  file = "_data/project_groups/#{category['file']}.yml"
  listed << file
  unless File.exist?(file)
    errors << "_data/projects.yml: #{category['name']} points to missing #{file}"
    next
  end

  previous = nil
  (load(file) || []).each_with_index do |entry, i|
    where = "#{file}: [#{i}] #{entry['title']}"
    titles[entry["title"]] << file

    url = entry.dig("media", "url").to_s
    errors << "#{where}: #{url} does not exist" if url.start_with?("/") && !File.exist?(url[1..])

    date = (entry["sort_date"] || entry["date"]).to_s
    # vs_code.yml is hand-ordered.
    if previous && date > previous && category["file"] != "vs_code"
      warnings << "#{where}: newer than the entry above it (entries are newest first)"
    end
    previous = date
  end
end

(Dir["_data/project_groups/*.yml"] - listed).each do |file|
  warnings << "#{file} is not listed in _data/projects.yml and won't render"
end
titles.each { |title, files| warnings << "#{title.inspect} appears in #{files.join(', ')}" if files.size > 1 }

warnings.each { |w| puts "warning: #{w}" }
errors.each { |e| puts "error: #{e}" }
puts "cross-file checks: #{errors.size} errors, #{warnings.size} warnings"
exit(errors.empty? ? 0 : 1)
