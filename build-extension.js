// ============================================
// FILE: build-extension.js (UPDATED)
// Builds extension with organized folder structure
// ============================================
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const RELEASE_DIR = 'release';
const ZIP_NAME = 'delivery-route-optimizer.zip';

console.log('🚀 Building Delivery Route Optimizer Extension...\n');

// Step 1: Clean release directory
console.log('📁 Cleaning release directory...');
if (fs.existsSync(RELEASE_DIR)) {
  fs.removeSync(RELEASE_DIR);
}
fs.mkdirSync(RELEASE_DIR);

// Step 2: Build React app
console.log('⚛️  Building React app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ React app built successfully\n');
} catch (error) {
  console.error('❌ Failed to build React app');
  process.exit(1);
}

// Step 3: Create folder structure
console.log('📋 Creating folder structure...');
const folders = ['popup', 'background', 'content', 'icons'];
folders.forEach(folder => {
  fs.mkdirSync(path.join(RELEASE_DIR, folder));
  console.log(`  ✓ ${folder}/`);
});

// Step 4: Copy extension files to organized folders
console.log('\n📋 Copying extension files...');

// Manifest (root)
fs.copySync('extension/manifest.json', path.join(RELEASE_DIR, 'manifest.json'));
console.log('  ✓ manifest.json');

// Popup files
fs.copySync('extension/popup.html', path.join(RELEASE_DIR, 'popup/popup.html'));
fs.copySync('extension/popup.js', path.join(RELEASE_DIR, 'popup/popup.js'));
console.log('  ✓ popup/popup.html');
console.log('  ✓ popup/popup.js');

// Background files
fs.copySync('extension/background.js', path.join(RELEASE_DIR, 'background/background.js'));
console.log('  ✓ background/background.js');

// Content files
fs.copySync('extension/content.js', path.join(RELEASE_DIR, 'content/content.js'));
fs.copySync('extension/print-content.js', path.join(RELEASE_DIR, 'content/print-content.js'));
console.log('  ✓ content/content.js');
console.log('  ✓ content/print-content.js');

// Step 5: Copy built React app as ui.html
console.log('\n📦 Copying React build files...');
fs.copySync('build/index.html', path.join(RELEASE_DIR, 'ui.html'));
console.log('  ✓ ui.html');

// Copy static folder
if (fs.existsSync('build/static')) {
  fs.copySync('build/static', path.join(RELEASE_DIR, 'static'));
  console.log('  ✓ static/ (JS, CSS, media)');
}

// Step 6: Copy/create icons
console.log('\n🎨 Handling icons...');
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = path.join('public', `icon${size}.png`);
  const targetPath = path.join(RELEASE_DIR, 'icons', `icon${size}.png`);
  
  if (fs.existsSync(iconPath)) {
    fs.copySync(iconPath, targetPath);
    console.log(`  ✓ icons/icon${size}.png`);
  } else {
    fs.writeFileSync(targetPath + '.txt', `Placeholder for ${size}x${size} icon`);
    console.log(`  ⚠️  icons/icon${size}.png missing (placeholder created)`);
  }
});

// Step 7: Create ZIP file
console.log('\n📦 Creating ZIP archive...');
const output = fs.createWriteStream(ZIP_NAME);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ ZIP created: ${ZIP_NAME} (${sizeInMB} MB)`);

  console.log('\n🧹 Cleaning up intermediate release directory...');
  fs.removeSync(RELEASE_DIR);
  console.log(`✅ Directory ${RELEASE_DIR} removed.`);

  console.log('\n🎉 Extension build complete!');
  console.log(`\n📍 File location: ./${ZIP_NAME}`);
  console.log(`\n📁 Organized structure:`);
  console.log(`   ├── manifest.json`);
  console.log(`   ├── popup/`);
  console.log(`   ├── background/`);
  console.log(`   ├── content/`);
  console.log(`   ├── icons/`);
  console.log(`   ├── ui.html`);
  console.log(`   └── static/`);
  console.log(`\n💡 To install:`);
  console.log(`   1. Extract ${ZIP_NAME}`);
  console.log(`   2. Open Chrome: chrome://extensions/`);
  console.log(`   3. Enable "Developer mode"`);
  console.log(`   4. Click "Load unpacked" and select extracted folder`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(RELEASE_DIR, false);
archive.finalize();