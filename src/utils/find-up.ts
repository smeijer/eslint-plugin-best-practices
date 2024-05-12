import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function toPath(urlOrPath: string | URL | undefined) {
	return urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
}

export function findUp(name: string, { cwd = process.cwd(), stopAt }: { cwd?: string; stopAt?: string } = {}) {
	let directory = path.resolve(toPath(cwd) ?? '');
	const { root } = path.parse(directory);
	stopAt = path.resolve(directory, toPath(stopAt) ?? root);

	while (directory && directory !== stopAt && directory !== root) {
		const filePath = path.isAbsolute(name) ? name : path.join(directory, name);
		const stats = fs.statSync(filePath, { throwIfNoEntry: false });

		if (stats?.isFile()) {
			return filePath;
		}

		directory = path.dirname(directory);
	}
}
