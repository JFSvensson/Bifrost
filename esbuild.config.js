/**
 * esbuild Configuration for Bifrost
 * 
 * Provides two build modes:
 * - Development: Readable output, source maps, fast rebuilds
 * - Production: Minified, tree-shaken, optimized for deployment
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine build mode from command line argument or environment
const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

console.log(`\n🔨 Building in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...\n`);

// Find all TypeScript entry points
async function getEntryPoints() {
  const srcDir = resolve(__dirname, 'src');
  
  // Main entry points
  const entryPoints = [
    'src/main.ts',
    'src/sw.ts',
    'src/widgetLoader.ts'
  ];
  
  // Add all service files
  const servicesDir = resolve(srcDir, 'services');
  const services = await readdir(servicesDir);
  services.forEach(file => {
    if (file.endsWith('.ts')) {
      entryPoints.push(`src/services/${file}`);
    }
  });
  
  // Add all widget files
  const widgetsDir = resolve(srcDir, 'widgets');
  const widgets = await readdir(widgetsDir);
  widgets.forEach(file => {
    if (file.endsWith('.ts')) {
      entryPoints.push(`src/widgets/${file}`);
    }
  });
  
  // Add all utility files
  const utilsDir = resolve(srcDir, 'utils');
  const utils = await readdir(utilsDir);
  utils.forEach(file => {
    if (file.endsWith('.ts')) {
      entryPoints.push(`src/utils/${file}`);
    }
  });
  
  // Add core files
  const coreDir = resolve(srcDir, 'core');
  const core = await readdir(coreDir);
  core.forEach(file => {
    if (file.endsWith('.ts')) {
      entryPoints.push(`src/core/${file}`);
    }
  });
  
  // Add config files
  const configDir = resolve(srcDir, 'config');
  const config = await readdir(configDir);
  config.forEach(file => {
    if (file.endsWith('.ts')) {
      entryPoints.push(`src/config/${file}`);
    }
  });
  
  // Add integration files
  const integrationsDir = resolve(srcDir, 'integrations');
  const integrations = await readdir(integrationsDir);
  integrations.forEach(file => {
    if (file.endsWith('.ts')) {
      entryPoints.push(`src/integrations/${file}`);
    }
  });
  
  return entryPoints;
}

// Build function
async function build() {
  // Get entry points dynamically
  const entryPoints = await getEntryPoints();
  
  // Shared build configuration
  /** @type {esbuild.BuildOptions} */
  const baseConfig = {
    entryPoints: entryPoints,
    bundle: false,           // Keep module structure (not bundling into single file)
    format: 'esm',           // ES Modules output
    target: 'es2020',        // Match tsconfig.json target
    platform: 'browser',     // Browser environment
    outdir: isProduction ? 'dist-prod' : 'dist',
    outExtension: { '.js': '.js' },
    loader: {
      '.ts': 'ts'
    },
    logLevel: 'info'
  };

  // Development-specific configuration
  /** @type {esbuild.BuildOptions} */
  const devConfig = {
    ...baseConfig,
    sourcemap: true,         // Enable source maps for debugging
    minify: false,           // Readable output
    keepNames: true          // Keep function/class names
  };

  // Production-specific configuration
  /** @type {esbuild.BuildOptions} */
  const prodConfig = {
    ...baseConfig,
    sourcemap: false,        // No source maps (protect source code)
    minify: true,            // Aggressive minification
    keepNames: false,        // Shorten names for smaller size
    treeShaking: true,       // Remove unused code
    legalComments: 'none',   // Remove all comments
    drop: ['console', 'debugger'] // Remove console.log and debugger statements
  };
  
  const config = isProduction ? prodConfig : devConfig;
  
  try {
    if (isWatch) {
      // Watch mode (development only)
      const ctx = await esbuild.context(config);
      await ctx.watch();
      console.log('👁️  Watching for changes...');
    } else {
      // Single build
      const result = await esbuild.build(config);
      
      console.log('✅ Build completed successfully!\n');
      console.log(`📦 Output directory: ${config.outdir}/`);
      console.log(`📊 Minification: ${isProduction ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🗺️  Source maps: ${isProduction ? 'DISABLED' : 'ENABLED'}`);
      console.log(`🌳 Tree-shaking: ${isProduction ? 'ENABLED' : 'AUTO'}`);
      
      if (result.errors.length > 0) {
        console.error('\n❌ Build errors:');
        result.errors.forEach(err => console.error(err));
        process.exit(1);
      }
      
      if (result.warnings.length > 0) {
        console.warn('\n⚠️  Build warnings:');
        result.warnings.forEach(warn => console.warn(warn));
      }
      
      console.log('\n🎉 Build finished!\n');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build
build();
