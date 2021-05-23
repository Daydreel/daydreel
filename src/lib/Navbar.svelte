<script>
	const navItems = [{ label: 'Naheulbeuk', href: 'offfff/' }];
</script>

<style>
	.navbar {
		border-bottom: 1px solid #666;
		font-family: 'Raleway', sans-serif;
		font-weight: 100;
		display: flex;
		justify-content: space-between;
	}

	.nav-links {
		display: flex;
		list-style: none;
	}

	.nav-links > a {
		padding: 0.5em 1.2em 0.5em 1.2em;
		color: black;
		text-decoration: none;
		font-size: 1.4em;
		align-self: end;
	}

	.nav-links > a:hover {
		text-decoration: underline;
	}

	.brand {
		font-size: 1.4em;
	}

	.left-paint {
		height: 59px;
		width: 465px;
		background-image: url('/src/static/background-splash-left.png');
	}

	.right-paint {
		height: 59px;
		background-image: url('/src/static/background-splash-right.png');
		width: 465px;
	}
</style>

<nav class="navbar">
	<div class="left-paint" />
	<ul class="nav-links">
		<a href="/">
			<li class="brand">Daydreel</li>
		</a>
		{#each navItems as item}
			<a href={item.href}>
				<li>{item.label}</li>
			</a>
		{/each}
	</ul>
	<div class="right-paint" />
</nav>
