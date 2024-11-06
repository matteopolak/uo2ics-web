<script lang="ts">
	import init, { fromHtml } from '@matteopolak/uo2ics';
	import { Calendar } from '@fullcalendar/core';
	import dayGridPlugin from '@fullcalendar/daygrid';

	import { createEventSource } from '$lib/plugins/icalendar';
	import { downloadCalendar } from '$lib/download';

	type CalendarData = {
		name: string;
		ics: Promise<string>;
	};

	let files = $state<FileList>();
	let calendar: Calendar;
	let calendars: CalendarData[] = $state([]);

	let div = $state<HTMLDivElement>();

	$effect(() => {
		if (!div) return;

		calendar = new Calendar(div, {
			plugins: [dayGridPlugin]
		});

		calendar.render();
	});

	let done = $state(false);

	$effect(() => {
		if (!files) return;
		if (done) return;

		done = true;

		for (const file of files) {
			console.log('file', file);
			onCalendarAdd(file);
		}
	});

	async function onCalendarAdd(file: File) {
		const { promise, resolve } = Promise.withResolvers<string>();

		calendars.push({
			name: file.name,
			ics: promise
		});

		await init();

		const buffer = await file.arrayBuffer();
		const ics = fromHtml(new Uint8Array(buffer));

		calendar.addEventSource(createEventSource(ics));
		resolve(ics);
	}
</script>

<input type="file" accept=".html" bind:files />

{#each calendars as calendar}
	<p>{calendar.name}</p>
	{#await calendar.ics}
		loading...
	{:then ics}
		<button onclick={() => downloadCalendar(ics)}>download</button>
	{:catch error}
		<p>{error.message}</p>
	{/await}
{/each}

<div bind:this={div}></div>
