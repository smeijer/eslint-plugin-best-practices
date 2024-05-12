import { getTsconfig } from 'get-tsconfig';
import path from 'path';

import { debug } from './debug.ts';
import { findUp } from './find-up.ts';

type Config = { paths: Record<string, string>; root: string };
const configPaths = new Map<string, string>();
const configCache = new Map<string, Config>();

const packageJsonPath = findUp('package.json');
const root = packageJsonPath ? path.dirname(packageJsonPath) : '';

if (!root) throw new Error(`could not find root path, does this project have a package.json?`);
debug(`using root path: ${root}`);

export function getConfig(dirPath: string): Config {
	// we need to determine the new root, as we can be running in a monorepo
	if (configPaths.has(dirPath)) {
		return configCache.get(configPaths.get(dirPath)!)!;
	}

	const pkgJsonPath = findUp('package.json', { cwd: dirPath, stopAt: root });
	const pkgRoot = pkgJsonPath ? path.dirname(pkgJsonPath) : root;
	if (configPaths.has(pkgRoot)) {
		configPaths.set(dirPath, pkgRoot);
		return configCache.get(pkgRoot)!;
	}

	const tsConfig = getTsconfig(dirPath)?.config;
	const tsConfigPaths = tsConfig?.compilerOptions?.paths || {};

	const paths: Record<string, string> = {};
	for (const [path, aliases] of Object.entries(tsConfigPaths)) {
		const alias = path.replace(/\**$/, '');
		const replacement = aliases[0].replace(/\**$/, '');
		debug(`map path: ${alias} > ${replacement}`);
		paths[alias] = replacement;
	}

	configPaths.set(dirPath, pkgRoot);
	configPaths.set(pkgRoot, pkgRoot);
	configCache.set(pkgRoot, { paths, root: pkgRoot });
	return configCache.get(pkgRoot)!;
}

export function resolveAliases(dirPath: string, importPath: string) {
	const { paths, root } = getConfig(dirPath);

	for (const alias of Object.keys(paths)) {
		if (!importPath.startsWith(alias)) continue;

		importPath = importPath.replace(alias, paths[alias]);
		return path.resolve(root, importPath);
	}

	// return null for all paths that aren't relative by now. It's either a
	// node_module or a failed mapping. We'll ignore those.
	if (importPath[0] !== '.') return null;
	return path.resolve(dirPath, importPath);
}
