const fs = require('fs');
const path = require('path');

const profileDir = 'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb';
const files = fs.readdirSync(profileDir);

for (const file of files) {
  if (file.endsWith('.ldb') || file.endsWith('.log')) {
    const fullPath = path.join(profileDir, file);
    try {
      const buf = fs.readFileSync(fullPath);
      const str = buf.toString('latin1');
      if (str.includes('carvlak')) {
        console.log(`Match in Profile 2: ${file}`);
        const idx = str.indexOf('carvlak_detailing_quotes');
        if (idx !== -1) {
          console.log('Quotes found in Profile 2!');
          console.log(str.slice(idx, idx + 400).replace(/[\x00-\x1F\x7F-\x9F]/g, ' '));
        }
        const idxComms = str.indexOf('carvlak_commissions');
        if (idxComms !== -1) {
          console.log('Commissions found in Profile 2!');
          console.log(str.slice(idxComms, idxComms + 400).replace(/[\x00-\x1F\x7F-\x9F]/g, ' '));
        }
      }
    } catch (e) {}
  }
}
