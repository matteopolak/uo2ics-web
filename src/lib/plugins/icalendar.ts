import { ICalExpander } from '$lib/ical-expander';
import { type EventInput, type EventSourceFuncArg } from '@fullcalendar/core';
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

	// TODO: instead of using startDate/endDate.toString to communicate allDay,
	// we can query startDate/endDate.isDate. More efficient to avoid formatting/reparsing.

	// single events
	for (const iCalEvent of iCalRes.events) {
		expanded.push({
			...buildNonDateProps(iCalEvent),
			start: iCalEvent.startDate.toString(),
			// @ts-expect-error - `null` is supported
			end: specifiesEnd(iCalEvent) && iCalEvent.endDate ? iCalEvent.endDate.toString() : null
		});
	}

	// recurring event instances
	for (const iCalOccurence of iCalRes.occurrences) {
		const iCalEvent = iCalOccurence.item;
		expanded.push({
			...buildNonDateProps(iCalEvent),
			start: iCalOccurence.startDate.toString(),
			// @ts-expect-error - `null` is supported
			end:
				specifiesEnd(iCalEvent) && iCalOccurence.endDate ? iCalOccurence.endDate.toString() : null
		});
	}

	return expanded;
}

function buildNonDateProps(iCalEvent: Event): EventInput {
	return {
		title: iCalEvent.summary,
		url: extractEventUrl(iCalEvent),
		extendedProps: {
			location: iCalEvent.location,
			organizer: iCalEvent.organizer,
			description: iCalEvent.description
		}
	};
}

function extractEventUrl(iCalEvent: Event): string {
	const urlProp = iCalEvent.component.getFirstProperty('url');
	return urlProp ? urlProp.getFirstValue() : '';
}

function specifiesEnd(iCalEvent: Event) {
	return (
		Boolean(iCalEvent.component.getFirstProperty('dtend')) ||
		Boolean(iCalEvent.component.getFirstProperty('duration'))
	);
}

export function createEventSource(ics: string) {
	const expander = new ICalExpander({ ics });

	return async (arg: EventSourceFuncArg): Promise<EventInput[]> => {
		return expandICalEvents(expander, {
			start: arg.start,
			end: arg.end
		});
	};
}
