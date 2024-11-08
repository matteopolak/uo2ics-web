import { writable } from 'svelte/store';

export type CalendarInput = {
	name: string;
	ics: string;
};

export const calendars = writable<CalendarInput[]>([]);
