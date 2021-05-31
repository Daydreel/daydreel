import { respond } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths } from './runtime/paths.js';
import { set_prerendering } from './runtime/env.js';
import * as user_hooks from "./hooks.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.ico\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<div id=\"svelte\">" + body + "</div>\n\t</body>\n</html>\n";

let options = null;

// allow paths to be overridden in svelte-kit preview
// and in prerendering
export function init(settings) {
	set_paths(settings.paths);
	set_prerendering(settings.prerendering || false);

	options = {
		amp: false,
		dev: false,
		entry: {
			file: "/./_app/start-49c7732d.js",
			css: ["/./_app/assets/start-a8cd1609.css"],
			js: ["/./_app/start-49c7732d.js","/./_app/chunks/vendor-289f0ca5.js"]
		},
		fetched: undefined,
		floc: false,
		get_component_path: id => "/./_app/" + entry_lookup[id],
		get_stack: error => String(error), // for security
		handle_error: error => {
			console.error(error.stack);
			error.stack = options.get_stack(error);
		},
		hooks: get_hooks(user_hooks),
		hydrate: true,
		initiator: undefined,
		load_component,
		manifest,
		paths: settings.paths,
		read: settings.read,
		root,
		router: true,
		ssr: true,
		target: "#svelte",
		template,
		trailing_slash: "never"
	};
}

const d = decodeURIComponent;
const empty = () => ({});

const manifest = {
	assets: [],
	layout: "src/routes/__layout.svelte",
	error: ".svelte-kit/build/components/error.svelte",
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/example-markdown\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/example-markdown.md"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/offfff\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/offfff/__layout.svelte", "src/routes/offfff/index.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/offfff\/s1ep1\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/offfff/__layout.svelte", "src/routes/offfff/s1ep1.md"],
						b: [".svelte-kit/build/components/error.svelte"]
					}
	]
};

// this looks redundant, but the indirection allows us to access
// named imports without triggering Rollup's missing import detection
const get_hooks = hooks => ({
	getSession: hooks.getSession || (() => ({})),
	handle: hooks.handle || (({ request, render }) => render(request))
});

const module_lookup = {
	"src/routes/__layout.svelte": () => import("..\\..\\src\\routes\\__layout.svelte"),".svelte-kit/build/components/error.svelte": () => import("./components\\error.svelte"),"src/routes/index.svelte": () => import("..\\..\\src\\routes\\index.svelte"),"src/routes/example-markdown.md": () => import("..\\..\\src\\routes\\example-markdown.md"),"src/routes/offfff/__layout.svelte": () => import("..\\..\\src\\routes\\offfff\\__layout.svelte"),"src/routes/offfff/index.svelte": () => import("..\\..\\src\\routes\\offfff\\index.svelte"),"src/routes/offfff/s1ep1.md": () => import("..\\..\\src\\routes\\offfff\\s1ep1.md")
};

const metadata_lookup = {"src/routes/__layout.svelte":{"entry":"/./_app/pages/__layout.svelte-4dcac2dc.js","css":["/./_app/assets/pages/__layout.svelte-80181008.css"],"js":["/./_app/pages/__layout.svelte-4dcac2dc.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null},".svelte-kit/build/components/error.svelte":{"entry":"/./_app/error.svelte-f67d766c.js","css":[],"js":["/./_app/error.svelte-f67d766c.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null},"src/routes/index.svelte":{"entry":"/./_app/pages/index.svelte-dfe30eb3.js","css":["/./_app/assets/pages/index.svelte-1515a0b5.css"],"js":["/./_app/pages/index.svelte-dfe30eb3.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null},"src/routes/example-markdown.md":{"entry":"/./_app/pages/example-markdown.md-f50aa767.js","css":[],"js":["/./_app/pages/example-markdown.md-f50aa767.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null},"src/routes/offfff/__layout.svelte":{"entry":"/./_app/pages/offfff/__layout.svelte-86d7a585.js","css":["/./_app/assets/pages/offfff/__layout.svelte-e5b61364.css"],"js":["/./_app/pages/offfff/__layout.svelte-86d7a585.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null},"src/routes/offfff/index.svelte":{"entry":"/./_app/pages/offfff/index.svelte-6205435e.js","css":[],"js":["/./_app/pages/offfff/index.svelte-6205435e.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null},"src/routes/offfff/s1ep1.md":{"entry":"/./_app/pages/offfff/s1ep1.md-71b1260c.js","css":[],"js":["/./_app/pages/offfff/s1ep1.md-71b1260c.js","/./_app/chunks/vendor-289f0ca5.js"],"styles":null}};

async function load_component(file) {
	return {
		module: await module_lookup[file](),
		...metadata_lookup[file]
	};
}

init({ paths: {"base":"","assets":"/."} });

export function render(request, {
	prerender
} = {}) {
	const host = request.headers["host"];
	return respond({ ...request, host }, options, { prerender });
}