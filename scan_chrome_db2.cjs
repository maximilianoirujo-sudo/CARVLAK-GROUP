const fs = require('fs');
const path = require('path');

const chromeDir = 'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb';

const targetKeys = [
  'carvlak_detailing_quotes',
  'carvlak_commissions',
  'carvlak_detailing_payments',
  'carvlak_detailing_config',
  'carvlak_clients',
  'carvlak_supabase_url',
  'carvlak_supabase_anon_key'
];

const files = fs.readdirSync(chromeDir);
for (const file of files) {
  if (file.endsWith('.ldb') || file.endsWith('.log')) {
    const fullPath = path.join(chromeDir, file);
    try {
      const buf = fs.readFileSync(fullPath);
      const str = buf.toString('utf8');
      for (const k of targetKeys) {
        let pos = 0;
        while ((pos = str.indexOf(k, pos)) !== -1) {
          console.log(`=== Found ${k} in ${file} at ${pos} ===`);
          const chunk = str.slice(pos, pos + 400);
          console.log(chunk.replace(/[\x00-\x1F\x7F-\x9F]/g, ' '));
          pos += k.length + 1;
        }
      }
    } catch (e) {}
  }
}
