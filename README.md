# mattbierner.com

Source for [mattbierner.com](https://mattbierner.com)

## Running locally

This is a plain Jekyll site. Pushing to `master` publishes it with GitHub Pages.

1. Install Ruby 3.3 (the version GitHub Pages uses):

	```sh
	brew install ruby@3.3
	```

2. Serve the site (installs gems on first run):

	```sh
	tools/jekyll.sh serve
	```

3. Open <http://127.0.0.1:4000> in a browser.

Pass `--host 0.0.0.0` to make the dev server reachable from other devices on your network. Run `tools/jekyll.sh update` to update gems.
