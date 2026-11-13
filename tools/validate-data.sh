#!/bin/zsh
# Validates _data/ against the JSON Schemas in tools/schemas/ using
# check-jsonschema (run through uvx, nothing to install but uv), then runs the
# cross-file checks in tools/check-data.rb.
#
#   tools/validate-data.sh
#
# Add new data files here along with their schema.
cd "${0:A:h}/.."

check() { uvx check-jsonschema@0.39.0 --schemafile "tools/schemas/$1" "${@:2}" || failed=1 }

failed=0
check projects.schema.json _data/projects.yml
check site.schema.json _data/site.yml
check project-group.schema.json _data/project_groups/*.yml
ruby tools/check-data.rb || failed=1
exit $failed
