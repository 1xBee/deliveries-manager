// ============================================
// FILE: build-extension.js
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
console.log('⚛️  Building React app...');
try {
  // Assuming 'npm run build' generates the files in the 'build' directory
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ React app built successfully\n');
} catch (error) {
  console.error('❌ Failed to build React app');
  process.exit(1);
}

// Step 3: Copy extension files
console.log('📋 Copying extension files...');
const extensionFiles = [
  'extension/manifest.json',
  'extension/background.js',
  'extension/content.js',
  'extension/popup.html',
  'extension/popup.js'
];

extensionFiles.forEach(file => {
  const filename = path.basename(file);
  fs.copySync(file, path.join(RELEASE_DIR, filename));
  console.log(`  ✓ ${filename}`);
});

// Step 4: Copy built React app as ui.html
console.log('\n📦 Copying React build files...');

// Copy the main HTML file as ui.html (This is the full dashboard page)
fs.copySync('build/index.html', path.join(RELEASE_DIR, 'ui.html'));
console.log('  ✓ ui.html');

// Copy static folder (JS, CSS, etc.)
if (fs.existsSync('build/static')) {
  fs.copySync('build/static', path.join(RELEASE_DIR, 'static'));
  console.log('  ✓ static/ (JS, CSS, media)');
}

// Step 5: Create icons directory
console.log('\n🎨 Creating icons directory...');
const iconsDir = path.join(RELEASE_DIR, 'icons');
fs.mkdirSync(iconsDir);

// Copy actual icon files or create placeholders
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = path.join('public', `icon${size}.png`);
  const targetPath = path.join(iconsDir, `icon${size}.png`);
  
  if (fs.existsSync(iconPath)) {
    fs.copySync(iconPath, targetPath);
    console.log(`  ✓ icon${size}.png`);
  } else {
    // Create a text file as placeholder if missing
    fs.writeFileSync(targetPath + '.txt', `Placeholder for ${size}x${size} icon`);
    console.log(`  ⚠️  icon${size}.png missing (placeholder created)`);
  }
});

// Step 6: Create ZIP file and perform cleanup
console.log('\n📦 Creating ZIP archive...');
const output = fs.createWriteStream(ZIP_NAME);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ ZIP created: ${ZIP_NAME} (${sizeInMB} MB)`);

  // Cleanup: Remove the intermediate release directory
  console.log('\n🧹 Cleaning up intermediate release directory...');
  fs.removeSync(RELEASE_DIR);
  console.log(`✅ Directory ${RELEASE_DIR} removed.`);

  console.log('\n🎉 Extension build complete!');
  console.log(`\n📍 File location: ./${ZIP_NAME}`);
  console.log(`\n💡 To install:`);
  console.log(`   1. Open Chrome and go to chrome://extensions/`);
  console.log(`   2. Enable "Developer mode"`);
  console.log(`   3. Click "Load unpacked" (for testing the unzipped folder before cleanup) OR Drag and drop "${ZIP_NAME}" onto the extensions page.`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(RELEASE_DIR, false);
archive.finalize();