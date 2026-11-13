# mattbierner.com

Personal projects site. Plain Jekyll via the `github-pages` gem, published by GitHub Pages from `master`. No other build tooling: no npm, no JS/CSS bundling, no tests.

## Where things are

- `index.html`: the home page, with the hero animation and the project browser. The browser has two views:
  - grouped: `_includes/project-list-compact.html`, text only, in file order
  - chronological: `_includes/project-list-grid.html`, cards with media, sorted in `scripts/site.js` by `sort_date || date`
- `_data/projects.yml`: the categories, in page order. Each one points at `_data/project_groups/<file>.yml`, which holds that category's entries.
- `_data/site.yml`: nav links and the contact page's content.
- `content/<slug>/`: locally hosted project media.
- `tools/`: dev scripts, plus JSON Schemas for every `_data/` file in `tools/schemas/`. Not published.
- `.claude/skills` is a symlink to `.agents/skills`. Edit the real files.
- `_site/`: build output. Never edit.

Jekyll publishes everything that doesn't start with `_` or `.`, unless it's listed in `exclude` in `_config.yml`. Put dev-only files in `tools/` or a dot-directory.

## Data

To add or change a project, follow `.agents/skills/add-project/SKILL.md`. The schemas in `tools/schemas/` define every field.

What the schemas don't cover:

- Entries are newest first. `vs_code.yml` is hand-ordered and not strictly by date.
- Most media is hosted on the blog (`https://blog.mattbierner.com/content/<date>-<slug>/...`).
- Match the existing formatting: two-space indent, `links:` items at the same indent as the key, a blank line between entries.
- Each data file starts with a `# yaml-language-server: $schema=...` line so editors can validate as you type. Keep it there.
- A new data file needs a schema, that first line, and an entry in `tools/validate-data.sh`.
- Adding a field means updating the schema and the templates in `_includes/`.

After any data change, run this. It must exit cleanly:

```bash
tools/validate-data.sh
```

It validates each file against its schema with [check-jsonschema](https://github.com/python-jsonschema/check-jsonschema), run through `uvx` (needs `uv`, nothing else). Then `tools/check-data.rb` runs the checks a schema can't express: category files exist, local media exists, entries are newest first, no unlisted category files or duplicate titles.

## Running locally

`tools/jekyll.sh` runs Jekyll with Homebrew's `ruby@3.3` (what GitHub Pages builds with) and installs gems on first run.

```bash
tools/jekyll.sh serve
```

This serves <http://127.0.0.1:4000> (or `$PORT`) and rebuilds on change. Changes to `_config.yml` need a restart. Port 4000 is often taken by another copy of the site, so check which server is answering. To build without touching `_site/`, use `tools/jekyll.sh build -d <dir>`.

## Deploying

Pushing to `master` deploys. GitHub Pages builds the site itself ("Deploy from a branch", no Actions workflow) with its own pinned `github-pages` versions; `Gemfile.lock` only affects local builds. To match Pages locally, run `tools/jekyll.sh update`, then build and check the site. <https://pages.github.com/versions/> lists the versions Pages runs.

## Verifying

- Data changes: validate, then check both views on the home page. Media only appears in the chronological view.
- CSS/JS changes: check desktop and mobile widths. For the hero, also check `prefers-reduced-motion` and the pause toggle.
- No console errors.

## Conventions

- Keep it simple: static HTML, CSS and ES modules, as little JS as possible, no frameworks or build step.
- Use semantic HTML. Keep labels, alt text and keyboard behavior working.
- Commit messages are short and plain ("Add scrubspace").
