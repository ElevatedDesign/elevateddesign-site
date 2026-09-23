const fs = require('fs');
const path = require('path');

// Folders to scan — must match your actual folder names
const folders = ['logos', 'apparel', 'promotional', 'illustration', 'mature'];
const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

console.log('📂 Scanning folders...\n');

const manifest = {};

folders.forEach(function(folder) {
  const folderPath = path.join(publicDir, folder);
  if (!fs.existsSync(folderPath)) {
    console.log('  ⚠️  Folder not found: ' + folder + ' — skipping');
    manifest[folder] = [];
    return;
  }
  const files = fs.readdirSync(folderPath)
    .filter(function(f) {
      return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f) && !f.startsWith('.');
    })
    .sort();
  manifest[folder] = files;
  console.log('  ✅ ' + folder + ': ' + files.length + ' image(s) found');
});

const total = Object.values(manifest).reduce(function(sum, arr) { return sum + arr.length; }, 0);
console.log('\n  Total: ' + total + ' images\n');

// Build the replacement string
function buildManifestBlock() {
  var lines = ['var IMAGES = {'];
  folders.forEach(function(folder, fi) {
    lines.push('  ' + folder + ': [');
    manifest[folder].forEach(function(file) {
      lines.push("    '" + file.replace(/'/g, "\\'") + "',");
    });
    lines.push('  ]' + (fi < folders.length - 1 ? ',' : ''));
  });
  lines.push('};');
  return lines.join('\n');
}

// Read index.html and replace the IMAGES block
let html = fs.readFileSync(indexPath, 'utf8');

const startMarker = '// ── IMAGE MANIFEST ──────────────────────────────────────────';
const endMarker = '};';

const startIdx = html.indexOf(startMarker);
if (startIdx === -1) {
  console.log('❌ Could not find IMAGE MANIFEST block in index.html');
  console.log('   Make sure index.html is inside the public/ folder.');
  process.exit(1);
}

const endIdx = html.indexOf(endMarker, startIdx);
if (endIdx === -1) {
  console.log('❌ Could not find end of IMAGES block.');
  process.exit(1);
}

const before = html.substring(0, startIdx);
const after = html.substring(endIdx + endMarker.length);

const newBlock = startMarker + '\n' + buildManifestBlock();
html = before + newBlock + after;

fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ index.html updated successfully!');
console.log('   Commit and push to Netlify to see your images live.\n');
