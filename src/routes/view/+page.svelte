<script lang="ts">
	import Calendar from '@event-calendar/core';
	import TimeGrid from '@event-calendar/time-grid';
	import { Download } from 'lucide-svelte';

	import { createEventSource, type Source } from '$lib/plugins/icalendar';
	import { downloadCalendar } from '$lib/download';
	import { type CalendarInput, calendars } from '$lib/stores';
	import { Button } from '$lib/components/ui/button';

	let calendar: Calendar;
	let sources = $state<Source[]>([]);
	let width = $state(0);

	const added = new Set<CalendarInput>();

	$effect(() => {
		for (const input of $calendars) {
			if (added.has(input)) continue;

			added.add(input);
			sources.push(createEventSource(input.ics));
		}

		calendar.setOption('eventSources', sources);
	});

	$effect(() => {
		if (width < 768) {
			if (calendar.getOption('view') !== 'timeGridDay') calendar.setOption('view', 'timeGridDay');
		} else {
			if (calendar.getOption('view') !== 'timeGridWeek') calendar.setOption('view', 'timeGridWeek');
		}
	});
</script>

{#snippet item(calendar: CalendarInput)}
	<li class="border p-2">
		<Button
			onclick={() => downloadCalendar(calendar.ics)}
			aria-label="Download calendar"
			title="Download calendar"
			class="ml-2"
			variant="ghost"
		>
			{calendar.name}
			<Download />
		</Button>
	</li>
{/snippet}

<ul>
	{#each $calendars as calendar (calendar.name)}
		{@render item(calendar)}
	{/each}
</ul>

<div class="flex place-items-center justify-center px-4 pt-8">
	<div class="w-full max-w-7xl">
		<Calendar
			bind:this={calendar}
			plugins={[TimeGrid]}
			options={{
				view: 'timeGridWeek',
				eventSources: sources,
				allDaySlot: false,
				slotMinTime: '08:30:00',
				slotMaxTime: '22:00:00'
			}}
		/>
	</div>
</div>

<svelte:window bind:innerWidth={width} />

<style>
	:global(.ec) {
		--ec-border-color: hsl(var(--border));
		--ec-event-bg-color: hsl(var(--secondary) / 80%);
		--ec-event-text-color: hsl(var(--secondary-foreground));
		--ec-today-bg-color: hsl(var(--accent) / 25%);
		--ec-button-active-bg-color: hsl(var(--accent) / 80%);
	}

	:global(.ec-header) {
		@apply rounded-t-md;
	}

	:global(.ec-body) {
		@apply rounded-b-md;
	}

	:global(.ec-button) {
		@apply inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0;
	}
</style>
