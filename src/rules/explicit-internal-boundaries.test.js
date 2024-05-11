const { RuleTester } = require('eslint');
const explicitInternalBoundaries = require('./explicit-internal-boundaries.js');
const test = require('node:test');
const path = require('node:path');
const tsConfig = require('../../tsconfig.json');
RuleTester.afterAll = test.after;
const assert = require('assert');

// If you are not using vitest with globals: true (https://vitest.dev/config/#globals):
RuleTester.it = test.it;
RuleTester.itOnly = test.it.only;
RuleTester.describe = test.describe;

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: '2020',
    sourceType: 'module',
  },
});

// assert that the tsconfig paths are still defined
void test.it('tsconfig.json still matches test requirements', () => {
	assert.deepEqual(tsConfig.compilerOptions.paths["#testcase/*"], ["./app/*"], 'tsconfig.json#paths are changed!');
	assert.deepEqual(tsConfig.compilerOptions.paths["~/*"], ["./*"], 'tsconfig.json#paths are changed!');
})

function createTest(filename, importPath) {
	filename = path.resolve(filename);

	// different import methods
	return [
		{ code: `import '${importPath}';`, filename },
		{ code: `import('${importPath}');`, filename },
		{ code: `require('${importPath}');`, filename },
	]
}

ruleTester.run('explicit-internal-boundaries', explicitInternalBoundaries, {
	valid: [
		// Import from a same sibling internal directory
		['./app/module/routes/index.ts', '../internal/util.ts'],
		// Import from a nested internal directory
		['./app/module/routes/index.ts', './components/button.ts'],
		// Import from a child internal directory within a nested path
		['./app/module/index.ts', './internal/routes/index.ts'],
		// Multiple nested internal imports, deeper level
		['./app/module/internal/a/b/c/index.ts', '../../b/util.ts'],
		// Parent internal, import from child directory
		['./app/module/internal/index.ts', './routes/util.ts'],
		// Using alias to import from an internal directory
		['./app/module/a/index.ts', '#testcase/module/a/internal/util.ts'],
		// Using different alias to import from an internal directory
		['./app/module/a/index.ts', '~/app/module/a/internal/util.ts'],
		// nested internal directories
		['./app/internal/component.ts', './internal/util.ts'],
	].flatMap(([filename, importPath])=> createTest(filename, importPath)).concat([
		// ignore dynamic imports with vars
		{ code: [
				"const BUILD_PATH = path.join(CWD, '.build/index.js');",
				"import(BUILD_PATH);",
			].join('\n')}
	]),
	invalid: [
		// Import from a sibling internal to another sibling
		['./app/module/a/index.ts', '../b/internal/util.ts'],
		// Import across different parent internal directories
		['./app/module/a/routes/index.ts', '#testcase/module/b/internal/util.ts'],
		// Import from a different parent path using alias
		['./app/module/a/index.ts', '~/app/system/internal/util.ts'],
		// Alias import that attempts to bridge different internal scopes
		['./app/module/a/index.ts', '#testcase/module/b/internal/util.ts'],
		// Import from a sibling internal nested inside another internal directory
		['./app/internal/utils/internal/calc.ts', '../lib/internal/warn.ts']
	].flatMap(([filename, importPath])=> createTest(filename, importPath)).map(x => ({ ...x, errors: 1 })),
});
