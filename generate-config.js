// generate-config.js
// This script generates config.js with the GITHUB_TOKEN from environment variables
const fs = require('fs');
const token = process.env.GITHUB_TOKEN || '';
fs.writeFileSync('config.js', `window.GITHUB_TOKEN = "${token}";\n`);
console.log('config.js generated with GITHUB_TOKEN');
