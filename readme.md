# eslint-plugin-best-practices

> an eslint plugin to enforce some best practices

## Install

```sh
npm install eslint-plugin-best-practices
```

## Usage

```js
// eslintrc.js
module.exports = {
  plugins: ['eslint-plugin-best-practices'],
  rules: {
    'best-practices/explicit-internal-boundaries': ['error'],
		'best-practices/isolated-route-files': ['error', {
			'routeFiles': ['app/*/routes/**'],
			'ignoredRouteFiles': ['.*', '**/*.css'],
		}]
  },
}
```

## Rule: best-practices/explicit-internal-boundaries

```js
module.exports = {
  rules: {
  	'best-practices/explicit-internal-boundaries': ['error'],
  },
};
```

### What It Does

This rule enforces explicit boundaries for importing files from `internal` directories. It ensures that files within an `internal` folder can only be imported by files that reside within the same module or directory tree. This rule prevents access to internal-specific code from outside its designated module, reinforcing module encapsulation and promoting cleaner, more maintainable code architecture.

### Why It's Good Practice

Enforcing explicit internal boundaries:

- **Encourages Encapsulation**: Keeps internal module logic and dependencies self-contained, reducing the risk of unintended side effects and dependencies across the broader codebase.
- **Improves Maintainability**: Makes the codebase easier to manage and refactor, as changes to internal structures do not impact external modules.
- **Enhances Modularity**: Promotes a clear modular structure where modules are only aware of their own internal implementations and exposed interfaces, not the internals of other modules.

### Configuration Example

Here is an example of how you might configure this rule in your ESLint setup:

```javascript
module.exports = {
	rules: {
		'best-practices/explicit-internal-boundaries': ['error'],
	},
};
```

### Import Boundaries

Here is an example of how this rule applies to a typical project structure:

```plaintext
./app
├── module-a
│   ├── internal
│   │   ├── helper-a.ts
│   │   └── config-a.ts
│   └── service-a.ts
├── module-b
│   ├── internal
│   │   └── helper-b.ts
│   └── service-b.ts
└── common
    └── utils.ts
```

With the `explicit-internal-boundaries` rule applied:

- `service-a.ts` can import `helper-a.ts` or `config-a.ts` because they are in the same module.
- `service-b.ts` cannot import `helper-a.ts` or `config-a.ts` because it crosses module boundaries.
- `utils.ts` in the `common` directory cannot import any files from `internal` directories in either `module-a` or `module-b`.

This rule ensures that each module's internals remain isolated, reinforcing clear and robust architectural boundaries within the application.


## Rule: `best-practices/isolated-route-files`

```js
module.exports = {
	rules: {
		'best-practices/isolated-route-files': ['error', {
			'routeFiles': ['app/*/routes/**'],
			'ignoredRouteFiles': ['.*', '**/*.css'],
		}],
	},
};
```
### What It Does

This rule enforces isolation for route or page files, based on file-based routing conventions. It ensures that files designated as route handlers remain decoupled from the rest of the application, prohibiting imports from these files into any other part of the application. This rule supports a clean separation between routing mechanisms and business logic, adhering to modern frontend architecture practices.

### Why It's Good Practice

Maintaining isolation of route files:

- **Supports Clean Architecture**: Ensures that routing concerns are separated from business logic, which is fundamental in frameworks that utilize file-based routing.
- **Reduces Coupling**: Prevents tight coupling between routes and other parts of the application, facilitating easier refactoring and scaling.
- **Enforces Convention**: Reinforces the convention over configuration paradigm, where route files are strictly used for routing based on their path and filename.

### Configuration Example

Here is an example of how you might configure this rule in your ESLint setup:

```javascript
module.exports = {
	rules: {
		'best-practices/isolated-route-files': ['error', {
			'routeFiles': ['app/*/routes/**'],
			'ignoredRouteFiles': ['.*', '**/*.css', '**/*.test.{ts,tsx}'],
		}],
	},
};
```

### Import Boundaries

Here is an example of the application structure with route files and the expected enforcement by this rule:

```plaintext
./app
├── analytics
│   ├── config.ts
│   └── routes
│       ├── api.ts
│       └── index.tsx
├── auth
│   ├── config.ts
│   └── routes
│       ├── auth.auth0.callback.tsx
│       ├── login.tsx
│       └── logout.tsx
├── broadcasts-notifications
│   ├── config.ts
│   └── routes
│       ├── $notificationId.tsx
│       └── _layout.tsx
`````

With the `isolated-route-files` rule applied:
- Files like `api.ts`, `index.tsx`, `login.tsx`, etc., within any `routes` directory are prohibited from being imported into other parts of the application.
- This ensures that all route handlers are used solely for routing purposes and not entangled with other application logic.

This rule promotes a disciplined use of routing files, keeping them isolated as per the file-based routing conventions in modern web development frameworks.
