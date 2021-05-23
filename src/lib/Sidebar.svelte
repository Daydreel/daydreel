<script>
	const navItems = [
		{ label: 'Préface', href: '/offfff' },
		{ label: 'Episode 1', href: '/offfff/s1ep1' }
	];
</script>

<style>
	.sidebar {
		font-size: 1.3em;
		padding: 1em 0em 0em 1em;
		margin: 0em 1em 0em 0em;
		border-right-style: solid;
		border-width: 2px;
		border-color: #333;
		background-color: white;
		list-style: none;
	}
	li {
		list-style: none;
	}

	.side-links {
		padding: 0.5em 1.2em 0.5em 1.2em;
		color: black;
		text-decoration: none;
		font-size: 1em;
		align-self: end;
		font-family: 'Raleway', sans-serif;
		line-height: 1.6em;
	}

	.side-links:hover {
		text-decoration: underline;
	}
</style>

<nav class="sidebar">
	<ul>
		{#each navItems as item}
			<li>
				<a class="side-links" href={item.href}>{item.label}</a>
			</li>
		{/each}
	</ul>
</nav>
