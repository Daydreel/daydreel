const c = [
	() => import("..\\..\\..\\src\\routes\\__layout.svelte"),
	() => import("..\\components\\error.svelte"),
	() => import("..\\..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\example-markdown.md"),
	() => import("..\\..\\..\\src\\routes\\offfff\\__layout.svelte"),
	() => import("..\\..\\..\\src\\routes\\offfff\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\offfff\\s1ep1.md")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/example-markdown.md
	[/^\/example-markdown\/?$/, [c[0], c[3]], [c[1]]],

	// src/routes/offfff/index.svelte
	[/^\/offfff\/?$/, [c[0], c[4], c[5]], [c[1]]],

	// src/routes/offfff/s1ep1.md
	[/^\/offfff\/s1ep1\/?$/, [c[0], c[4], c[6]], [c[1]]]
];

export const fallback = [c[0](), c[1]()];