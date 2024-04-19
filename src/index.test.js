const rules = require('./index.js').rules;

for (const rule of Object.keys(rules)) {
  console.log(`testing: ${rule}`);
  require(`./rules/${rule}.test.js`);
}
