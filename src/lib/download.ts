// https://github.com/scalar/scalar/blob/main/packages/api-reference/src/helpers/specDownloads.ts#L9
export function downloadCalendar(ics: string) {
	const blob = new Blob([ics], { type: 'application/calendar' });
	const data = URL.createObjectURL(blob);
	const filename = 'calendar.ics';

	const link = document.createElement('a');
	link.href = data;
	link.download = filename;

	link.dispatchEvent(
		new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		})
	);

	setTimeout(() => {
		URL.revokeObjectURL(data);
		link.remove();
	}, 100);
}
