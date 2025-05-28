import { ICalExpander } from '$lib/ical-expander';
import type { DateRange } from '@fullcalendar/core/internal';
import { addDays } from '@fullcalendar/core/internal';
import type { Event } from 'ical.js';

function expandICalEvents(iCalExpander: ICalExpander, range: DateRange): EventInput[] {
	// expand the range. because our `range` is timeZone-agnostic UTC
	// or maybe because ical.js always produces dates in local time? i forget
	const rangeStart = addDays(range.start, -1);
	const rangeEnd = addDays(range.end, 1);

	const iCalRes = iCalExpander.between(rangeStart, rangeEnd); // end inclusive. will give extra results
	const expanded: EventInput[] = [];

	// single events
	for (const iCalEvent of iCalRes.events) {
		expanded.push({
			...buildNonDateProps(iCalEvent),
			start: iCalEvent.startDate.toJSDate(),
			end: specifiesEnd(iCalEvent) && iCalEvent.endDate ? iCalEvent.endDate.toJSDate() : new Date()
		});
	}

	// recurring event instances
	for (const iCalOccurence of iCalRes.occurrences) {
		const iCalEvent = iCalOccurence.item;
		expanded.push({
			...buildNonDateProps(iCalEvent),
			start: iCalOccurence.startDate.toJSDate(),
			end:
				specifiesEnd(iCalEvent) && iCalOccurence.endDate
					? iCalOccurence.endDate.toJSDate()
					: new Date()
		});
	}

	return expanded;
}

function buildNonDateProps(iCalEvent: Event): Partial<EventInput> {
	return {
		title: iCalEvent.summary,
		extendedProps: {
			location: iCalEvent.location,
			organizer: iCalEvent.organizer,
			description: iCalEvent.description
		}
	};
}

function specifiesEnd(iCalEvent: Event) {
	return (
		Boolean(iCalEvent.component.getFirstProperty('dtend')) ||
		Boolean(iCalEvent.component.getFirstProperty('duration'))
	);
}

export type FetchInfo = {
	start: Date;
	end: Date;
};

export type Source = {
	events(
		info: FetchInfo,
		success: (events: Array<EventInput>) => void,
		failure: (errorInfo: object) => void
	): void;
	startDate: Date;
};

export type EventInput = {
	id?: number | string;
	start: Date;
	end: Date;
	title?: string;
	editable?: boolean;
	startEditable?: boolean;
	durationEditable?: boolean;
	resourceIds?: string | number | Array<string | number>;
	resourceId?: string | number | Array<string | number>;
	display?: 'auto' | 'background';
	backgroundColor?: string;
	textColor?: string;
	color?: string;
	classNames?: string | string[];
	className?: string | string[];
	styles?: string | string[];
	style?: string | string[];
	extendedProps?: Record<string, unknown>;
};

export function createEventSource(ics: string): Source {
	const expander = new ICalExpander({ ics });

	return {
		events(info, success) {
			success(
				expandICalEvents(expander, {
					start: info.start,
					end: info.end
				})
			);
		},
		startDate: expander.startDate
	};
}
