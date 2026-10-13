const https = require('https');

https.get('https://carvlak-group.vercel.app/assets/index-B9I5PKMm.js', (res) => {
  let js = '';
  res.on('data', (c) => (js += c));
  res.on('end', () => {
    console.log('Total JS length:', js.length);
    const matches = [...js.matchAll(/supabase\.co/gi)];
    console.log('Matches for supabase.co:', matches.length);
    for (const m of matches) {
      console.log('Match at', m.index, ':', js.slice(Math.max(0, m.index - 50), m.index + 100));
    }
  });
});
