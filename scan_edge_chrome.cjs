const fs = require('fs');
const path = require('path');

const dirs = [
  'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb',
  'C:\\Users\\maxim\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb'
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  console.log('--- Scanning dir:', dir);
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
      const fullPath = path.join(dir, file);
      try {
        const buf = fs.readFileSync(fullPath);
        const str = buf.toString('latin1');
        const posQuotes = str.indexOf('carvlak_detailing_quotes');
        if (posQuotes !== -1) {
          console.log(`Found carvlak_detailing_quotes in ${file}`);
        }
        const posComms = str.indexOf('carvlak_commissions');
        if (posComms !== -1) {
          console.log(`Found carvlak_commissions in ${file}`);
        }
      } catch (e) {}
    }
  }
}
