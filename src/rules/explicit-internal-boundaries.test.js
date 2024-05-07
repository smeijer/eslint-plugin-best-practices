const { RuleTester } = require('eslint');
const explicitInternalBoundaries = require('./explicit-internal-boundaries.js');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: '2020',
    sourceType: 'module',
  },
});

ruleTester.run('explicit-internal-boundaries', explicitInternalBoundaries, {
  valid: [
    // child path is fine
    { code: "import './internal/foo.ts';" },
    { code: "import('./internal/foo.ts');" },
    { code: "require('./internal/foo.ts');" },

    // going deeper is fine too
    { code: "import './internal/nested/internal/deep.ts';" },
    { code: "import('./internal/nested/internal/deep.ts');" },
    { code: "require('./internal/nested/internal/deep.ts');" },

		// should ignore dynamic imports with vars
		{ code: [
				"const BUILD_PATH = path.join(CWD, '.build/index.js');",
				"import(BUILD_PATH);",
		].join('\n')}
  ],
  invalid: [
    // can't go up when the path contains /internal/
    { code: "import '../sibling/internal/foo.ts';", errors: 1 },
    { code: "import('../sibling/internal/foo.ts');", errors: 1 },
    { code: "require('../sibling/internal/foo.ts');", errors: 1 },

    // trying to circumvent by first going relative, and then up
    { code: "import './../sibling/internal/bar.ts';", errors: 1 },
    { code: "import('./../sibling/internal/foo.ts');", errors: 1 },
    { code: "require('./../sibling/internal/foo.ts');", errors: 1 },

    // no absolute paths when the path contains /internal/
    { code: "import '#/test/sibling/internal/foo.ts';", errors: 1 },
    { code: "import('#/test/sibling/internal/foo.ts');", errors: 1 },
    { code: "require('#/test/sibling/internal/foo.ts');", errors: 1 },
  ],
});

console.log('All tests passed!');
