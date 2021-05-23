<script>
	import Sidebar from '$lib/Sidebar.svelte';
</script>

<style>
	.story {
		grid-column-start: 2;
		grid-column-end: 2;
		text-align: justify;
		line-height: 1.4em;
		font-size: 18px;
		font-family: 'PT Serif', serif;
	}
</style>

<Sidebar />
<div class="story">
	<slot />
</div>
