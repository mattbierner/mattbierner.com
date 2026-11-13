---
name: add-project
description: Add, update, move, or remove a project entry on mattbierner.com (the YAML files in _data/project_groups/), including adding its image or video. Use when the user says things like "add X to the site", "add my new app", "update the link for Y", "move Z to Experiments", or gives a blog post / App Store URL for a new project.
---

# Add or edit a project entry

Entries live in `_data/project_groups/<file>.yml`, one file per category (see `_data/projects.yml`). Fields are defined in `tools/schemas/project-group.schema.json`. Ordering and formatting rules are in `AGENTS.md`. Read the target file first and match it.

## Gather the details

- Given a blog post URL (`https://blog.mattbierner.com/<slug>/`), fetch its title, date, summary, and title image or video. Post media lives under `https://blog.mattbierner.com/content/<YYYY-MM-DD>-<slug>/`.
- Pick the category from `_data/projects.yml`:
  - iOS: iOS and AR apps
  - Experiments: small web tools and toys
  - Tech: libraries and utilities
  - Art, Letterpress, Fun, and VS Code: what their names say

  Ask only if it's genuinely unclear.
- Descriptions are short and plain, in the voice of the existing entries ("Share audio messages with AR effects."). Don't invent claims. If you draft one, say so.
- Ask for anything you can't find. Don't guess dates or URLs.

## Media

- Prefer media already on the blog, and link to it by URL.
- Local media goes in `content/<slug>/` with a lowercase, hyphenated slug.
  - Images: about 1200px on the long edge (`sips -Z 1200 <file>`), a few hundred KB at most.
  - Videos: short, silent, loopable H.264 MP4s.
- Always write `alt` text that describes what's shown.

## Write the entry

- Insert it newest first. For `vs_code.yml`, ask where it goes if you're unsure.
- The first link becomes the title link, so put the main destination first: the app, the site, or the store page.
- To move a project, remove it from one file and insert it in date order in the other.

## Verify

Validate the data and check both views, as described in `AGENTS.md`. Report what changed and where. Don't commit unless asked. If asked, use a message like `Add <project>` and include any new `content/` files.
