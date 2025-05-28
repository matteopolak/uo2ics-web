// https://github.com/fullcalendar/fullcalendar/tree/main/packages/icalendar/src/ical-expander
import { default as ic } from 'ical.js';
import type { Component, Event, Occurrence } from 'ical.js';

export type ExpanderOptions = {
	ics: string;
	maxIterations?: number;
	skipInvalidDates?: boolean;
};

export class ICalExpander {
	private maxIterations: number;
	private skipInvalidDates: boolean;
	private component: Component;
	private events: Event[];
	public startDate: Date;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private raw: any;

	constructor(opts: ExpanderOptions) {
		this.maxIterations = opts.maxIterations ?? 1_000;
		this.skipInvalidDates = opts.skipInvalidDates ?? false;

		this.raw = ic.parse(opts.ics);
		this.component = new ic.Component(this.raw);
		this.events = this.component
			.getAllSubcomponents('vevent')
			.map((vevent) => new ic.Event(vevent));

		this.startDate = new Date();

		for (const event of this.events) {
			// If the event has no start date, we set it to the current date
			if (!event.startDate) {
				continue;
			}

			// if current date is before this.startDate, update startDate
			const eventStartDate = event.startDate.toJSDate();

			if (eventStartDate < this.startDate) {
				this.startDate = eventStartDate;
			}
		}

		if (this.skipInvalidDates) {
			this.events = this.events.filter((evt) => {
				try {
					evt.startDate.toJSDate();
					evt.endDate.toJSDate();
					return true;
				} catch {
					return false;
				}
			});
		}
	}

	between(after?: Date, before?: Date) {
		function isEventWithinRange(startTime: number, endTime: number) {
			return (!after || endTime >= after.getTime()) && (!before || startTime <= before.getTime());
		}

		function getTimes(eventOrOccurrence: Event | Occurrence) {
			const startTime = eventOrOccurrence.startDate.toJSDate().getTime();
			let endTime = eventOrOccurrence.endDate.toJSDate().getTime();

			// If it is an all day event, the end date is set to 00:00 of the next day
			// So we need to make it be 23:59:59 to compare correctly with the given range
			if (eventOrOccurrence.endDate.isDate && endTime > startTime) {
				endTime -= 1;
			}

			return { startTime, endTime };
		}

		const exceptions = [] as Event[];

		this.events.forEach((event) => {
			if (event.isRecurrenceException()) exceptions.push(event);
		});

		const ret = {
			events: [] as Event[],
			occurrences: [] as Occurrence[]
		};

		this.events
			.filter((e) => !e.isRecurrenceException())
			.forEach((event) => {
				const exdates = [] as number[];

				event.component.getAllProperties('exdate').forEach((exdateProp) => {
					const exdate = exdateProp.getFirstValue();
					exdates.push(exdate.toJSDate().getTime());
				});

				// Recurring event is handled differently
				if (event.isRecurring()) {
					const iterator = event.iterator();

					let next;
					let i = 0;

					do {
						i += 1;
						next = iterator.next();
						if (next) {
							const occurrence = event.getOccurrenceDetails(next);

							const { startTime, endTime } = getTimes(occurrence);

							const isOccurrenceExcluded = exdates.indexOf(startTime) !== -1;

							// TODO check that within same day?
							const exception = exceptions.find(
								(ex) =>
									ex.uid === event.uid &&
									ex.recurrenceId.toJSDate().getTime() === occurrence.startDate.toJSDate().getTime()
							);

							// We have passed the max date, stop
							if (before && startTime > before.getTime()) break;

							// Check that we are within our range
							if (isEventWithinRange(startTime, endTime)) {
								if (exception) {
									ret.events.push(exception);
								} else if (!isOccurrenceExcluded) {
									ret.occurrences.push(occurrence);
								}
							}
						}
					} while (next && (!this.maxIterations || i < this.maxIterations));

					return;
				}

				// Non-recurring event:
				const { startTime, endTime } = getTimes(event);

				if (isEventWithinRange(startTime, endTime)) ret.events.push(event);
			});

		return ret;
	}

	before(before: Date) {
		return this.between(undefined, before);
	}

	after(after: Date) {
		return this.between(after);
	}

	all() {
		return this.between();
	}
}
