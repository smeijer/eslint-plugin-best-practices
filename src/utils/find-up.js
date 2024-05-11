const path = require('path');
const { fileURLToPath } = require('url');
const toPath = urlOrPath => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;
const fs = require('fs');

module.exports.findUp = function (name, {
	cwd = process.cwd(),
	stopAt,
} = {}) {
	let directory = path.resolve(toPath(cwd) ?? '');
	const { root} = path.parse(directory);
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
