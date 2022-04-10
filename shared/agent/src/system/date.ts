"use strict";

export namespace Dates {
	/**
	 * Returns the current time in UTC as an ISO date/time string
	 *
	 * @export
	 * @return {*}  {string} formatted like 2021-01-29T18:32:39Z
	 */
	export function toUtcIsoNow(): string {
		const date = new Date();
		return new Date(
			Date.UTC(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				date.getHours(),
				date.getMinutes(),
				date.getSeconds()
			)
		).toISOString();
	}
}
