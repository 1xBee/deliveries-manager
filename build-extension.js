// ============================================
// FILE: build-extension.js
// Three build modes: extension, react, or all
// ============================================
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const RELEASE_DIR = 'release';
const ZIP_NAME = 'delivery-route-optimizer.zip';

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'all';

// Validate mode
const validModes = ['extension', 'react', 'all'];
if (!validModes.includes(mode)) {
  console.error(`❌ Invalid mode: ${mode}`);
  console.error(`💡 Valid modes: ${validModes.join(', ')}`);
  process.exit(1);
}

console.log(`🚀 Building Delivery Route Optimizer [${mode.toUpperCase()}]...\n`);

// ============================================
// BUILD FUNCTIONS
// ============================================

/**
 * Build React app
 */
function buildReact() {
  console.log('⚛️  Building React app...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ React app built successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to build React app');
    return false;
  }
}

/**
 * Build extension from extension-src (webpack)
 */
function buildExtension() {
  console.log('🔧 Building extension from extension-src...');
  try {
    execSync('npm run build:extension', { stdio: 'inherit' });
    console.log('✅ Extension files built successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to build extension files');
    return false;
  }
}

/**
 * Prepare release directory structure
 */
function prepareReleaseDirectory() {
  console.log('📁 Preparing release directory...');
  
  if (fs.existsSync(RELEASE_DIR)) {
    fs.removeSync(RELEASE_DIR);
  }
  fs.mkdirSync(RELEASE_DIR);
  
  const folders = ['popup', 'background', 'content', 'icons'];
  folders.forEach(folder => {
    fs.mkdirSync(path.join(RELEASE_DIR, folder));
  });
  
  console.log('✅ Release directory prepared\n');
}

/**
 * Copy extension files to release directory
 */
function copyExtensionFiles() {
  console.log('📋 Copying extension files...');
  
  // Manifest (root)
  fs.copySync('extension/manifest.json', path.join(RELEASE_DIR, 'manifest.json'));
  console.log('  ✓ manifest.json');
  
  // Popup files
  fs.copySync('extension/popup.html', path.join(RELEASE_DIR, 'popup/popup.html'));
  fs.copySync('extension/popup.js', path.join(RELEASE_DIR, 'popup/popup.js'));
  console.log('  ✓ popup/');
  
  // Background files
  fs.copySync('extension/background.js', path.join(RELEASE_DIR, 'background/background.js'));
  console.log('  ✓ background/');
  
  // Content files
  fs.copySync('extension/content.js', path.join(RELEASE_DIR, 'content/content.js'));
  fs.copySync('extension/print-content.js', path.join(RELEASE_DIR, 'content/print-content.js'));
  console.log('  ✓ content/\n');
}

/**
 * Copy React build files
 */
function copyReactFiles() {
  console.log('📦 Copying React build files...');
  
  fs.copySync('build/index.html', path.join(RELEASE_DIR, 'ui.html'));
  console.log('  ✓ ui.html');
  
  if (fs.existsSync('build/static')) {
    fs.copySync('build/static', path.join(RELEASE_DIR, 'static'));
    console.log('  ✓ static/\n');
  }
}

/**
 * Copy/create icons
 */
function copyIcons() {
  console.log('🎨 Handling icons...');
  
  const iconSizes = [16, 48, 128];
  iconSizes.forEach(size => {
    const iconPath = path.join('public', `icon${size}.png`);
    const targetPath = path.join(RELEASE_DIR, 'icons', `icon${size}.png`);
    
    if (fs.existsSync(iconPath)) {
      fs.copySync(iconPath, targetPath);
      console.log(`  ✓ icons/icon${size}.png`);
    } else {
      fs.writeFileSync(targetPath + '.txt', `Placeholder for ${size}x${size} icon`);
      console.log(`  ⚠️  icons/icon${size}.png missing`);
    }
  });
  
  console.log('');
}

/**
 * Create ZIP file
 */
function createZip() {
  return new Promise((resolve, reject) => {
    console.log('📦 Creating ZIP archive...');
    
    const output = fs.createWriteStream(ZIP_NAME);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ ZIP created: ${ZIP_NAME} (${sizeInMB} MB)\n`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(RELEASE_DIR, false);
    archive.finalize();
  });
}

// ============================================
// MAIN BUILD PROCESS
// ============================================

async function main() {
  let shouldBuildReact = false;
  let shouldBuildExtension = false;
  let shouldPackage = false;
  
  // Determine what to build based on mode
  switch (mode) {
    case 'extension':
      console.log('📦 Mode: Extension only (from extension-src)\n');
      shouldBuildExtension = true;
      shouldPackage = true;
      break;
      
    case 'react':
      console.log('📦 Mode: React only\n');
      shouldBuildReact = true;
      shouldPackage = true;
      break;
      
    case 'all':
      console.log('📦 Mode: Build everything\n');
      shouldBuildReact = true;
      shouldBuildExtension = true;
      shouldPackage = true;
      break;
  }
  
  // Build React if needed
  if (shouldBuildReact) {
    if (!buildReact()) {
      process.exit(1);
    }
  }
  
  // Build extension if needed
  if (shouldBuildExtension) {
    if (!buildExtension()) {
      process.exit(1);
    }
  }
  
  // Package everything
  if (shouldPackage) {
    prepareReleaseDirectory();
    copyExtensionFiles();
    copyReactFiles();
    copyIcons();
    
    await createZip();
    
    // Clean up
    console.log('🧹 Cleaning up...');
    fs.removeSync(RELEASE_DIR);
    console.log(`✅ Directory ${RELEASE_DIR} removed.\n`);
  }
  
  console.log('🎉 Build complete!');
  console.log(`\n📍 File location: ./${ZIP_NAME}`);
  console.log(`\n💡 Build modes:`);
  console.log(`   npm run build:ext      - Build extension only`);
  console.log(`   npm run build:react    - Build React only`);
  console.log(`   npm run build:all      - Build everything`);
}

// Run main process
main().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});