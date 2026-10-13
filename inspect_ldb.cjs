const fs = require('fs');

const buf = fs.readFileSync('C:\\Users\\maxim\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\008839.ldb');
const str = buf.toString('latin1');

let pos = 0;
while ((pos = str.indexOf('carvlak', pos)) !== -1) {
  console.log('--- carvlak at', pos, '---');
  console.log(str.slice(pos, pos + 250).replace(/[\x00-\x1F\x7F-\x9F]/g, ' '));
  pos += 10;
}
