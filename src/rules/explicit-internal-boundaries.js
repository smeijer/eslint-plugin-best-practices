module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: "disallow import from internal directories unless it's a child route",
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    function checkPath(path, node) {
			if (typeof path !== 'string') return true;

      if (!path.includes('/internal/')) return true;

      if (path.includes('..')) {
        return context.report({
          node,
          message: 'imports from `internal` folders cannot navigate up to parent directories',
        });
      }

      if (!path.startsWith('./')) {
        return context.report({
          node,
          message: 'imports from `internal` folders must be specified using relative paths',
        });
      }
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
