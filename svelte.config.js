import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.cjs';
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';

export default {
	extensions: [".svelte", ...mdsvexConfig.extensions],
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		mdsvex(mdsvexConfig),
		preprocess()],

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: adapter({ out: "build" }),
		target: '#svelte'
	}
};



