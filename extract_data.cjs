const fs = require('fs');
const path = require('path');

const chromeProfiles = [
  'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb',
  'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb',
  'C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb'
];

const foundItems = {};

for (const pDir of chromeProfiles) {
  if (!fs.existsSync(pDir)) continue;
  const files = fs.readdirSync(pDir);
  for (const file of files) {
    if (!file.endsWith('.ldb') && !file.endsWith('.log')) continue;
    const full = path.join(pDir, file);
    try {
      const content = fs.readFileSync(full).toString('latin1');
      const keys = [
        'carvlak_detailing_quotes',
        'carvlak_commissions',
        'carvlak_detailing_payments',
        'carvlak_detailing_config',
        'carvlak_clients',
        'carvlak_vehicles',
        'carvlak_tasks',
        'carvlak_expenses'
      ];
      for (const k of keys) {
        let idx = 0;
        while ((idx = content.indexOf(k, idx)) !== -1) {
          // Look forward for json start '[' or '{'
          const snippet = content.slice(idx + k.length, idx + k.length + 50000);
          const startArr = snippet.indexOf('[');
          const startObj = snippet.indexOf('{');
          let start = -1;
          let isArr = false;
          if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
            start = startArr;
            isArr = true;
          } else if (startObj !== -1) {
            start = startObj;
            isArr = false;
          }

          if (start !== -1 && start < 40) {
            // attempt to extract balanced json
            const charOpen = isArr ? '[' : '{';
            const charClose = isArr ? ']' : '}';
            let depth = 0;
            let end = -1;
            for (let i = start; i < snippet.length; i++) {
              if (snippet[i] === charOpen) depth++;
              else if (snippet[i] === charClose) {
                depth--;
                if (depth === 0) {
                  end = i;
                  break;
                }
              }
            }
            if (end !== -1) {
              const rawJson = snippet.slice(start, end + 1);
              try {
                const parsed = JSON.parse(rawJson);
                if (!foundItems[k] || JSON.stringify(parsed).length > JSON.stringify(foundItems[k]).length) {
                  foundItems[k] = parsed;
                  console.log(`Successfully extracted ${k} (${Array.isArray(parsed) ? parsed.length + ' items' : 'object'}) from ${file}`);
                }
              } catch (e) {
                // not valid json directly
              }
            }
          }
          idx += k.length + 1;
        }
      }
    } catch (err) {}
  }
}

fs.writeFileSync('extracted_user_data.json', JSON.stringify(foundItems, null, 2), 'utf8');
console.log('Done extracting. Keys found:', Object.keys(foundItems));
