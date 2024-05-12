import { Rule } from 'eslint';
import path from 'path';

import { debug } from '../utils/debug';
import { resolveAliases } from '../utils/pkg-config.ts';

function logResult(result: string, filename: string, resolved: string, original: string) {
	if (!debug.enabled) return;
	debug(`report: ${result} import \n  from     : ${filename}\n  resolved : ${resolved}\n  import   : ${original}`);
}

const plugin: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Restrict importing from internal directories to code within the same parent directory tree.',
			category: 'Best Practices',
			recommended: false,
		},
		schema: [],
		messages: {
			internalImport: 'Access to internal directories is limited to code within the same parent directory tree.',
		},
	},
	create(context) {
		const filename = context.filename ?? context.getFilename();
		const dirname = path.dirname(filename);

		function checkPath(importPath: string, node: Rule.Node) {
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
