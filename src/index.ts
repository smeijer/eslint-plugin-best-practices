export function main(offset: number) {
	if (typeof offset !== 'number') {
		throw new TypeError(`Expected a number, got ${typeof offset}`);
	}

	return Date.now() + offset;
}
