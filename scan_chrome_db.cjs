const fs = require('fs');
const path = require('path');

const chromeDir = 'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb';

try {
  const files = fs.readdirSync(chromeDir);
  for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
      const fullPath = path.join(chromeDir, file);
      try {
        const buf = fs.readFileSync(fullPath);
        const str = buf.toString('latin1');
        if (str.includes('carvlak') || str.includes('detailing_quote') || str.includes('supabase')) {
          console.log(`Found match in ${file} (size: ${buf.length})`);
          
          const idxSupabase = str.indexOf('supabase.co');
          if (idxSupabase !== -1) {
            console.log('--- SUPABASE URL MATCH ---');
            console.log(str.slice(Math.max(0, idxSupabase - 50), idxSupabase + 150));
          }

          const idxAnon = str.indexOf('carvlak_supabase');
          if (idxAnon !== -1) {
            console.log('--- CARVLAK_SUPABASE KEY MATCH ---');
            console.log(str.slice(Math.max(0, idxAnon - 50), idxAnon + 200));
          }
        }
      } catch (err) {
        // file might be locked if chrome is running
      }
    }
  }
} catch (e) {
  console.error(e);
}
