<script lang="ts">
	import '../app.css';

	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import { calendars, type CalendarInput } from '$lib/stores';

	let { children } = $props();

	onMount(() => {
		const storedCalendars = localStorage.getItem('calendars');

		if (storedCalendars) {
			const parsedCalendars: CalendarInput[] = JSON.parse(storedCalendars);

			for (const calendar of parsedCalendars) {
				$calendars.push(calendar);
			}
		}

		$calendars = $calendars;
	});
</script>

<Toaster />

{@render children()}
