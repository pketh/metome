# functional organization plan

## server
./
	- server.js (handles connections and routing)
	- config.js (env defaults)
	> node_modules/
		> (stuff from npm)
	> metome
		> entries/
			- entries.js
			- search.js ...
		> entry/
			- entry.js
			- cover.js
		> settings/
			- settings.js
	- package.json
	- readme.md
*server.js > broken into pieces based on functional section*

## client
/public
Projects
	> shared/ (global stylus/css, common js libs (jquery...)
		- global.css
		- global.stylus
		- global.js
	> marketing/
		- marketing.js
		- marketing.stylus
		- marketing.css
		>- log in - or nest again[1]/
		>- sign up [1]/
	> metome/
		> libs/
			- socket.io
		- metome.js
		- metome.stylus
		- metome.css
		> entries/
		> entry/
			> libs/
				- jquery.autosize
				- jquery.typing
		> settings/
		> uploads/
			> ....


*client.js > broken into pieces based on functional section*
*host blog on seperate repo using github pages*

# https://github.com/artsy/flare/blob/master/doc/file_structure.md

# https://github.com/artsy/ezel#project-vs-apps-vs-components
Configuration is handled entirely by environment variables. For ease of setup there is a /config.js file that wraps process.env and declares sensible defaults for development.

# http://artsy.github.io/blog/2013/11/30/rendering-on-the-server-and-client-in-node-dot-js/

We wanted to avoid a monolithic organization that groups code by type such as “stylesheets”, “javascripts”, “controllers”, etc.. Not only is this a maintenance problem as it makes boundaries of your app unclear, but it also affects your users because it encourages grouping assets into large monolithic packages that take a long time to download.

Instead, we borrowed a page from Django and broke up our project into smaller conceptual pieces called “apps” (small express sub-applications mounted into the main project) and “components” (portions of reusable UI such as a modal widget). This let us easily maintain decoupled segments of our project and build up smaller asset packages through Browserify’s requires and Stylus’ imports. For more details on how this is done please check out Ezel, its organization, and asset pipeline docs.

