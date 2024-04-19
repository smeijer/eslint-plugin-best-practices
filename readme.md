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
    'best-practices/explicit-internal-boundaries': ['error']
  },
}
```

## Rules

### best-practices/explicit-internal-boundaries

This plugin detects imports from `internal` directories from non direct parent path. The practice comes from a GO convention, where `internal` directories are special. 

It's fine to import files from an `internal` directory is on a direct child path, but not when it's a parent or sibling directory.
