import { Rule } from 'eslint';

import explicitInternalBoundaries from './rules/explicit-internal-boundaries.js';
import isolatedRouteFiles from './rules/isolated-route-files.js';

export default {
	rules: {
		'explicit-internal-boundaries': explicitInternalBoundaries,
		'isolated-route-files': isolatedRouteFiles,
	},
} satisfies { rules: Record<string, Rule.RuleModule> };
