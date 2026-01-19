const fs = require('fs');
const crypto = require('crypto');

function computeSRI(path) {
  const data = fs.readFileSync(path);
  const hash = crypto.createHash('sha384').update(data).digest('base64');
  return `sha384-${hash}`;
}

const files = [
  'dist/css/app.min.css',
  'dist/js/app.min.js'
];

(async () => {
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`Missing file: ${f}`);
      continue;
    }
    console.log(`${f}: ${computeSRI(f)}`);
  }
})();
