#!/usr/bin/env node

/**
 * IMAGE OPTIMIZATION SCRIPT
 * Automatically optimizes images in the uploads directory at build time
 * - Resizes large images (max 2000px width)
 * - Compresses JPEG/PNG with quality settings
 * - Replaces originals in-place
 * - Incremental processing (skips unchanged files)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const CACHE_FILE = path.join(__dirname, '..', '.image-cache.json');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];

// Optimization settings
const JPEG_QUALITY = 80;
const PNG_COMPRESSION = 9;
const MAX_WIDTH_LARGE = 2000;
const MAX_WIDTH_MEDIUM = 1600;

// Statistics tracking
let stats = {
  processed: 0,
  skipped: 0,
  failed: 0,
  originalTotalSize: 0,
  optimizedTotalSize: 0,
  largestSavings: []
};

/**
 * Load image cache from file
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Warning: Could not load cache file:', error.message);
  }
  return {};
}

/**
 * Save image cache to file
 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving cache:', error.message);
  }
}

/**
 * Get all image files recursively from directory
 */
function getImageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      getImageFiles(filePath, fileList);
    } else {
      const ext = path.extname(file);
      if (IMAGE_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Check if file needs optimization
 */
function needsOptimization(filePath, cache) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const stat = fs.statSync(filePath);
  const mtime = stat.mtimeMs;

  if (!cache[relativePath]) {
    return true; // Never processed before
  }

  if (cache[relativePath].mtime !== mtime) {
    return true; // File has been modified
  }

  return false; // File unchanged since last optimization
}

/**
 * Optimize a single image file
 */
async function optimizeImage(filePath, cache) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  try {
    // Get original file size
    const originalStat = fs.statSync(filePath);
    const originalSize = originalStat.size;

    // Get image metadata
    const metadata = await sharp(filePath).metadata();

    // Determine target width
    let targetWidth = metadata.width;
    if (metadata.width > MAX_WIDTH_LARGE) {
      targetWidth = MAX_WIDTH_LARGE;
    } else if (metadata.width > MAX_WIDTH_MEDIUM) {
      targetWidth = MAX_WIDTH_MEDIUM;
    }
    // Don't resize if already smaller than MAX_WIDTH_MEDIUM

    // Create temp file path
    const tempPath = filePath + '.tmp';

    // Optimize based on format
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      await sharp(filePath)
        .resize(targetWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({
          quality: JPEG_QUALITY,
          mozjpeg: true
        })
        .toFile(tempPath);
    } else if (metadata.format === 'png') {
      await sharp(filePath)
        .resize(targetWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png({
          compressionLevel: PNG_COMPRESSION,
          palette: true
        })
        .toFile(tempPath);
    } else {
      console.log(`  ⊘ Skipped (unsupported format): ${relativePath}`);
      stats.skipped++;
      return;
    }

    // Get optimized file size
    const optimizedStat = fs.statSync(tempPath);
    const optimizedSize = optimizedStat.size;

    // Only replace if optimization actually reduced size
    if (optimizedSize < originalSize) {
      // Replace original with optimized
      fs.renameSync(tempPath, filePath);

      // Update cache
      cache[relativePath] = {
        mtime: originalStat.mtimeMs,
        originalSize: originalSize,
        optimizedSize: optimizedSize,
        processedAt: new Date().toISOString()
      };

      // Update statistics
      stats.processed++;
      stats.originalTotalSize += originalSize;
      stats.optimizedTotalSize += optimizedSize;

      const savedBytes = originalSize - optimizedSize;
      const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

      // Track largest savings
      stats.largestSavings.push({
        file: relativePath,
        originalSize: originalSize,
        optimizedSize: optimizedSize,
        savedBytes: savedBytes,
        savedPercent: savedPercent
      });

      console.log(`  ✓ Optimized: ${relativePath}`);
      console.log(`    ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savedPercent}% smaller)`);
    } else {
      // Optimized version is larger, keep original
      fs.unlinkSync(tempPath);

      cache[relativePath] = {
        mtime: originalStat.mtimeMs,
        originalSize: originalSize,
        optimizedSize: originalSize,
        processedAt: new Date().toISOString()
      };

      stats.skipped++;
      console.log(`  ⊘ Skipped (no improvement): ${relativePath}`);
    }

  } catch (error) {
    console.error(`  ✗ Failed to optimize ${relativePath}:`, error.message);
    stats.failed++;
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Print summary statistics
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('✓ IMAGE OPTIMIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Processed:  ${stats.processed} images`);
  console.log(`Skipped:    ${stats.skipped} images (unchanged or no improvement)`);

  if (stats.failed > 0) {
    console.log(`Failed:     ${stats.failed} images`);
  }

  console.log('');

  if (stats.processed > 0) {
    const totalSaved = stats.originalTotalSize - stats.optimizedTotalSize;
    const totalPercent = ((totalSaved / stats.originalTotalSize) * 100).toFixed(1);

    console.log(`Original total:  ${formatBytes(stats.originalTotalSize)}`);
    console.log(`Optimized total: ${formatBytes(stats.optimizedTotalSize)}`);
    console.log(`Saved:           ${formatBytes(totalSaved)} (${totalPercent}% reduction)`);
    console.log('');

    // Show top 3 largest savings
    if (stats.largestSavings.length > 0) {
      console.log('Largest savings:');
      stats.largestSavings
        .sort((a, b) => b.savedBytes - a.savedBytes)
        .slice(0, 3)
        .forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.file}`);
          console.log(`     ${formatBytes(item.originalSize)} → ${formatBytes(item.optimizedSize)} (${item.savedPercent}% smaller)`);
        });
    }
  } else {
    console.log('No images needed optimization.');
  }

  console.log('');
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🖼️  Starting image optimization...\n');

  // Load cache
  const cache = loadCache();

  // Get all image files
  const imageFiles = getImageFiles(UPLOADS_DIR);

  if (imageFiles.length === 0) {
    console.log('No images found in uploads directory.');
    console.log('');
    return;
  }

  console.log(`Found ${imageFiles.length} image(s) in uploads directory.\n`);

  // Process each image
  for (const filePath of imageFiles) {
    if (needsOptimization(filePath, cache)) {
      await optimizeImage(filePath, cache);
    } else {
      const relativePath = path.relative(path.join(__dirname, '..'), filePath);
      console.log(`  → Cached: ${relativePath}`);
      stats.skipped++;
    }
  }

  // Save updated cache
  saveCache(cache);

  // Print summary
  printSummary();
}

// Run main function
main().catch(error => {
  console.error('Fatal error during image optimization:', error);
  process.exit(0); // Exit with 0 to not block deployment
});
