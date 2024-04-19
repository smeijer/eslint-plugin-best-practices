import { main } from './index.js';

test('main', () => {
	expect(() => {
		// @ts-expect-error main expects a number
		main('hello-world');
	}).toThrow('Expected a number, got string');

	expect(main(0)).toBeCloseTo(Date.now(), 0);
});
