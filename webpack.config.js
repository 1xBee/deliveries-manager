// ============================================
// FILE: webpack.config.js
// Use this if you want to keep modular code with imports
// ============================================
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './extension-src/background/background.js',
    content: './extension-src/content/content.js',
    'print-content': './extension-src/content/print-content.js',
    popup: './extension-src/popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'extension'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'extension-src/manifest.json', to: 'manifest.json' },
        { from: 'extension-src/popup/popup.html', to: 'popup.html' },
        //{ from: 'extension-src/icons', to: 'icons' }
      ]
    })
  ],
  optimization: {
    minimize: false // Keep code readable for debugging
  }
};

// ============================================
// Installation Instructions:
// ============================================
// 1. Install dependencies:
//    npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env copy-webpack-plugin
//
// 2. Update package.json scripts:
//    "scripts": {
//      "build:extension": "webpack --config webpack.config.js",
//      "watch:extension": "webpack --watch --config webpack.config.js"
//    }
//
// 3. Create extension-src/ folder with modular code
//
// 4. Run: npm run build:extension
//
// Output goes to extension/ folder (bundled, no imports)