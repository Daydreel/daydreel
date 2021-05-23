<script>
	import Navbar from '$lib/Navbar.svelte';
	import '../global.css';
	//import '$lib/themes/newsprint.css';
</script>

<link rel="preconnect" href="https://fonts.gstatic.com" />
<link
	href="https://fonts.googleapis.com/css2?family=Raleway:wght@100;300&display=swap"
	rel="stylesheet" />

<link rel="preconnect" href="https://fonts.gstatic.com" />
<link href="https://fonts.googleapis.com/css2?family=PT+Serif&display=swap" rel="stylesheet" />

<Navbar />
<div class="body">
	<div class="content">
		<slot />
	</div>
</div>
