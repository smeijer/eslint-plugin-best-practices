const { getTsconfig } = require('get-tsconfig');
const path = require('path');
const { findUp } = require('../utils/find-up');
const fs = require('fs');
const debug = require('debug')('explicit-internal-boundaries');

const packageJsonPath = findUp('package.json');
const root = path.dirname(packageJsonPath);

debug(`using root path: ${root}`);

if (!root) throw new Error(`could not find root path, does this project have a package.json?`);

const configPaths = new Map();
const configCache = new Map();

function getConfig(dirPath) {
	// we need to determine the new root, as we can be running in a monorepo
	if (configPaths.has(dirPath)) {
		return configCache.get(configPaths.get(dirPath));
	}

	const pkgJsonPath = findUp('package.json', { cwd: dirPath, stopAt: root });
	const pkgRoot = pkgJsonPath ? path.dirname(pkgJsonPath) : root;
	if (configPaths.has(pkgRoot)) {
		configPaths.set(dirPath, pkgRoot);
		return configCache.get(pkgRoot);
	}

	const tsConfig = getTsconfig(dirPath).config;
	const tsConfigPaths = tsConfig?.compilerOptions?.paths || {};

	const paths = {};
	for (const [path, aliases] of Object.entries(tsConfigPaths)) {
		const alias = path.replace(/\**$/, '');
		const replacement = aliases[0].replace(/\**$/, '');
		debug(`map path: ${alias} > ${replacement}`);
		paths[alias] = replacement;
	}

	configPaths.set(dirPath, pkgRoot);
	configPaths.set(pkgRoot, pkgRoot);
	configCache.set(pkgRoot, { paths, root: pkgRoot });
	return configCache.get(pkgRoot);
}

function resolveAliases(dirPath, importPath) {
	const { paths, root } = getConfig(dirPath);

	for (let alias of Object.keys(paths)) {
		if (!importPath.startsWith(alias)) continue;

		importPath = importPath.replace(alias, paths[alias]);
		return path.resolve(root, importPath)
	}

	// return null for all paths that aren't relative by now. It's either a
	// node_module or a failed mapping. We'll ignore those.
	if (importPath[0] !== '.') return null;
	return path.resolve(dirPath, importPath);
}

function logResult(result, filename, resolved, original) {
	if (!debug.enabled) return;
	debug(`report: ${result} import \n  from     : ${filename}\n  resolved : ${resolved}\n  import   : ${original}`)
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: "Restrict importing from internal directories to code within the same parent directory tree.",
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
		messages: {
			internalImport: "Access to internal directories is limited to code within the same parent directory tree."
		}
  },
  create(context) {
		const filename = context.filename ?? context.getFilename();
		const dirname = path.dirname(filename);

		function checkPath(importPath, node) {
			// ignore dynamic imports that hold a variable, like import(`${SOME_FILE}`);
			if (typeof importPath !== 'string') return true;

			const resolvedImportPath = resolveAliases(dirname, importPath);
			// ignore node_modules or paths that couldn't get resolved
			if (!resolvedImportPath) return true;
			if (!resolvedImportPath.includes('/internal/')) return true;

			// Find the root directory containing the "internal" segment
			const internalRootPath = resolvedImportPath.substring(0, resolvedImportPath.lastIndexOf('/internal/') + 1);
			const hasSharedRoot = filename.startsWith(internalRootPath);
			if (hasSharedRoot) {
				logResult('valid', filename, resolvedImportPath, importPath);
				return true;
			}

			logResult('invalid', filename, resolvedImportPath, importPath);
			return context.report({
				node,
				messageId: 'internalImport',
			});
    }

    return {
      ImportDeclaration(node) {
        checkPath(node.source.value, node);
      },
      ImportExpression(node) {
        checkPath(node.source.value, node);
      },
      CallExpression(node) {
        if (node.callee.name === 'require' && node.arguments.length === 1 && node.arguments[0].type === 'Literal') {
          checkPath(node.arguments[0].value, node);
        }
      },
    };
  },
};
