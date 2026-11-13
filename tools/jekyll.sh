#!/bin/zsh
# Runs Jekyll with Homebrew's ruby@3.3 (GitHub Pages builds with Ruby 3.3) and a
# per-project gem path. Install once with: brew install ruby@3.3
#
#   tools/jekyll.sh build
#   tools/jekyll.sh serve            # http://127.0.0.1:4000, honors $PORT
#   tools/jekyll.sh build -d /tmp/x  # build somewhere other than _site/
#   tools/jekyll.sh update           # bundle update (refresh Gemfile.lock)
set -e
cd "${0:A:h}/.."
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
export BUNDLE_PATH="${BUNDLE_PATH:-$HOME/.bundle-gems/mattbierner.com}"
if [[ "$1" == "update" ]]; then
  exec bundle update
fi
bundle check >/dev/null || bundle install
if [[ "$1" == "serve" && -n "$PORT" ]]; then
  set -- "$@" --port "$PORT"
fi
exec bundle exec jekyll "$@"
