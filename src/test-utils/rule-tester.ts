/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path';
import test from 'node:test';

import { RuleTester } from 'eslint';

(RuleTester as any).afterAll = test.after;
(RuleTester as any).it = test.it;
(RuleTester as any).itOnly = test.it.only;
(RuleTester as any).describe = test.describe;

export const ruleTester = new RuleTester({
	parserOptions: {
		ecmaVersion: '2020',
		sourceType: 'module',
	},
});

export function createImportTest(filename: string, importPath: string) {
	filename = path.resolve(filename);

	// different import methods
	return [
		{ code: `import '${importPath}';`, filename },
		{ code: `import('${importPath}');`, filename },
		{ code: `require('${importPath}');`, filename },
	];
}
