import test from 'node:test';

import assert from 'assert';

import tsConfig from '../../tsconfig.json';
import { createImportTest, ruleTester } from '../test-utils/rule-tester.js';
import isolatedRouteFiles from './isolated-route-files.ts';

// assert that the tsconfig paths are still defined
void test.it('tsconfig.json still matches test requirements', () => {
	assert.deepEqual(tsConfig.compilerOptions.paths['#testcase/*'], ['./app/*'], 'tsconfig.json#paths are changed!');
	assert.deepEqual(tsConfig.compilerOptions.paths['~/*'], ['./*'], 'tsconfig.json#paths are changed!');
});

const options = [
	{
		routeFiles: ['app/*/routes/**'],
		ignoredRouteFiles: ['**/*.css'],
	},
];

ruleTester.run('isolated-route-files', isolatedRouteFiles, {
	valid: [
		['./app/products/routes/route.ts', '../internal/util.ts'],
		['./app/products/routes/route.css', './style.css'],
		['./app/users/util.tsx', '../products/routes/route.css'],
	]
		.flatMap(([filename, importPath]) => createImportTest(filename, importPath))
		.concat([
			// ignore dynamic imports with vars
			{
				code: ["const BUILD_PATH = path.join(CWD, '.build/index.js');", 'import(BUILD_PATH);'].join('\n'),
				filename: './app/util.ts',
			},
		])
		.map((x) => ({ ...x, options })),

	invalid: [
		['./app/products/routes/route.ts', './other-route.ts'],
		['./app/products/routes/index.ts', '../../users/routes/user.ts'],
		['./app/users/util.tsx', '../products/routes/index.ts'],
		['./app/products/routes/route.ts', '~/app/users/routes/cart.ts'],
		['./app/products/routes/route.ts', '#testcase/users/routes/basket.ts'],
	]
		.flatMap(([filename, importPath]) => createImportTest(filename, importPath))
		.map((x) => ({ ...x, errors: 1, options })),
});
