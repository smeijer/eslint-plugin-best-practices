import { Rule } from 'eslint';
import { minimatch } from 'minimatch';
import path from 'path';

import { getConfig, resolveAliases } from '../utils/pkg-config.ts';

const cache = new Map<
	string,
	{
		isRouteFile: boolean;
		shouldIgnore: boolean;
	}
>();

// const routeFiles = new Map<string, Set<string>>();
const plugin: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Route files should be isolated, importing from them is not allowed.',
			category: 'Best Practices',
			recommended: false,
		},
		schema: [
			{
				type: 'object',
				properties: {
					routeFiles: {
						type: ['string', 'array'],
						items: { type: 'string' },
					},
					ignoredRouteFiles: {
						type: ['string', 'array'],
						items: { type: 'string' },
					},
				},
				required: ['routeFiles'],
			},
		],
		messages: {
			routeImport: 'Route files must remain isolated, importing from them is not allowed.',
		},
	},
	create(context) {
		const filename = context.filename ?? context.getFilename();
		const dirname = path.dirname(filename);

		const { root } = getConfig(dirname);
		const options = context.options[0];

		const routeFiles: string[] = Array.isArray(options.routeFiles) ? options.routeFiles : [options.routeFiles];
		const ignoredRouteFiles: string[] = Array.isArray(options.ignoredRouteFiles)
			? options.ignoredRouteFiles
			: [options.ignoredRouteFiles];

		function checkPath(importPath: string, node: Rule.Node) {
			// ignore dynamic imports that hold a variable, like import(`${SOME_FILE}`);
			if (typeof importPath !== 'string') return true;

			const resolvedImportPath = resolveAliases(dirname, importPath);
			// ignore node_modules or paths that couldn't get resolved
			if (!resolvedImportPath) return true;

			const relative = resolvedImportPath.slice(root.length + 1);
			const cacheHit = cache.get(resolvedImportPath);

			const isRouteFile = cacheHit?.isRouteFile ?? routeFiles.some((pattern) => minimatch(relative, pattern));
			const shouldIgnore = cacheHit?.shouldIgnore ?? ignoredRouteFiles.some((pattern) => minimatch(relative, pattern));

			if (!cacheHit) {
				cache.set(resolvedImportPath, {
					isRouteFile,
					shouldIgnore,
				});
			}

			if (!isRouteFile || shouldIgnore) return true;

			return context.report({
				node,
				messageId: 'routeImport',
			});
		}

		return {
			ImportDeclaration(node) {
				if (typeof node.source.value !== 'string') return;
				checkPath(node.source.value, node);
			},
			ImportExpression(node) {
				if (!('value' in node.source) || typeof node.source.value !== 'string') return;
				checkPath(node.source.value, node);
			},
			CallExpression(node) {
				if (!('name' in node.callee)) return;
				if (node.callee.name !== 'require') return;
				if (node.arguments.length !== 1) return;
				if (node.arguments[0].type !== 'Literal' || typeof node.arguments[0].value !== 'string') return;
				checkPath(node.arguments[0].value, node);
			},
		};
	},
};

export default plugin;
