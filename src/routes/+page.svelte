<script lang="ts">
	import { UploadIcon, LoaderPinwheel } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import init, { fromHtml } from '@matteopolak/uo2ics';

	import * as Card from '$lib/components/ui/card';
	import { calendars } from '$lib/stores';
	import { goto, preloadData } from '$app/navigation';

	let active = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let files = $state<FileList>();
	let loading = $state(false);

	$effect(() => {
		if (files?.length) onCalendarAttach(files);
	});

	function onDropCalendar(event: DragEvent) {
		event.preventDefault();
		active = false;

		if (loading) return;

		if (!event.dataTransfer?.files?.length) return;

		for (const file of event.dataTransfer.files) {
			if (!file.type.includes('html')) {
				toast.error('Upload the HTML file of your "My Course Schedule" page.');
				return;
			}
		}

		onCalendarAttach(event.dataTransfer.files);
	}

	function onSelectCalendar() {
		if (loading) return;

		fileInput?.click();
	}

	async function onCalendarAttach(files: FileList) {
		loading = true;
		const preload = preloadData('/view');

		await init();

		$calendars.splice(0, $calendars.length);

		for (const file of files) {
			const buffer = await file.arrayBuffer();
			const ics = fromHtml(new Uint8Array(buffer));

			$calendars.push({
				name: file.name,
				ics
			});
		}

		localStorage.setItem('calendars', JSON.stringify($calendars));

		await preload;
		goto('/view');
	}
</script>

<input type="file" accept=".html" hidden bind:this={fileInput} bind:files multiple />

<div class="flex max-h-screen min-h-screen place-items-center justify-center p-4">
	<Card.Root
		ondrop={onDropCalendar}
		ondragover={(e) => {
			e.preventDefault();
			active = true;
		}}
		ondragenter={() => (active = true)}
		ondragleave={() => (active = false)}
		onclick={onSelectCalendar}
		role="button"
		tabindex={0}
		class="transition-all duration-200 {loading
			? 'aspect-square cursor-pointer rounded-full'
			: `aspect-[9/16] w-full max-w-xl border-2 md:aspect-video ${
					active
						? 'border-primary/50 bg-card-foreground/5'
						: 'border-dashed hover:border-solid hover:border-primary/50 hover:bg-card-foreground/5'
				}`}"
	>
		<Card.Content
			class="flex h-full flex-col place-items-center justify-center gap-2 {loading ? 'p-0' : ''}"
		>
			{#if loading}
				<LoaderPinwheel class="h-full w-16 animate-spin" />
			{:else}
				<UploadIcon />
				<p class="text-sm text-muted-foreground">Drop your calendar here</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
