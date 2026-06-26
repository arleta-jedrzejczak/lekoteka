const fs = require('fs');
const path = require('path');

const browserDir = path.join(__dirname, '..', 'dist', 'lekoteka', 'browser');
const indexFile = path.join(browserDir, 'index.html');
const fallbackFile = path.join(browserDir, '404.html');

fs.copyFileSync(indexFile, fallbackFile);
console.log(`Skopiowano ${indexFile} -> ${fallbackFile}`);
