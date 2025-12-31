#!/usr/bin/env node

/**
 * BULK PHOTO UPLOAD SCRIPT
 *
 * This script batch-creates photo entries from images in the uploads directory.
 * It automatically generates markdown files for each photo that doesn't have one yet.
 *
 * Usage:
 *   node scripts/bulk-photo-upload.js
 *
 * What it does:
 *   1. Scans /uploads/ for images (jpg, jpeg, png)
 *   2. Checks which images don't have corresponding markdown files in content/photos/
 *   3. Creates markdown files with auto-generated titles and dates
 *   4. Uses the image optimization system (runs optimize-images.js first)
 *
 * The images will be optimized automatically by the existing optimize-images.js script.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PHOTOS_DIR = path.join(__dirname, '..', 'content', 'photos');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Get all image files from uploads directory
 */
function getImageFiles() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('Error: uploads directory not found');
    return [];
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  return files.filter(file => {
    const ext = path.extname(file);
    return IMAGE_EXTENSIONS.includes(ext) && !file.includes('_mobile');
  });
}

/**
 * Get existing photo markdown files
 */
function getExistingPhotos() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(PHOTOS_DIR);
  return files.filter(file => file.endsWith('.md'));
}

/**
 * Extract photo path from markdown file
 */
function getPhotoPathFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/photo:\s*(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * Generate slug from filename
 */
function generateSlug(filename) {
  return filename
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png)$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate title from filename
 */
function generateTitle(filename) {
  return filename
    .replace(/\.(jpg|jpeg|png)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Create markdown file for a photo
 */
function createPhotoMarkdown(imageFile, options = {}) {
  const date = new Date().toISOString().split('T')[0];
  const slug = generateSlug(imageFile);
  const title = options.title || generateTitle(imageFile);
  const caption = options.caption || '';
  const location = options.location || '';
  const description = options.description || '';

  const filename = `${date}-${slug}.md`;
  const filePath = path.join(PHOTOS_DIR, filename);

  const content = `---
title: ${title}
date: ${new Date().toISOString()}
photo: /uploads/${imageFile}
caption: ${caption}
location: ${location}
description: ${description}
---
`;

  fs.writeFileSync(filePath, content, 'utf8');
  return filename;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n📸 Bulk Photo Upload Tool\n');
  console.log('This script will create photo entries for images without markdown files.\n');

  // Get all images
  const imageFiles = getImageFiles();
  if (imageFiles.length === 0) {
    console.log('No images found in uploads directory.');
    rl.close();
    return;
  }

  // Get existing photos
  const existingPhotos = getExistingPhotos();
  const existingImagePaths = existingPhotos.map(photoFile => {
    const photoPath = getPhotoPathFromMarkdown(path.join(PHOTOS_DIR, photoFile));
    return photoPath ? path.basename(photoPath) : null;
  }).filter(Boolean);

  // Find images without markdown files
  const newImages = imageFiles.filter(img => !existingImagePaths.includes(img));

  if (newImages.length === 0) {
    console.log('✓ All images already have photo entries!');
    console.log(`  Total images: ${imageFiles.length}`);
    console.log(`  Existing entries: ${existingPhotos.length}`);
    rl.close();
    return;
  }

  console.log(`Found ${newImages.length} image(s) without photo entries:\n`);
  newImages.forEach((img, i) => {
    console.log(`  ${i + 1}. ${img}`);
  });
  console.log('');

  // Ask user how to proceed
  const mode = await prompt('Choose mode:\n  [1] Auto-generate entries (default titles)\n  [2] Interactive (customize each photo)\n  [3] Cancel\n\nEnter choice (1-3): ');

  if (mode === '3' || mode.toLowerCase() === 'cancel') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  const isInteractive = mode === '2';
  let created = 0;

  for (const imageFile of newImages) {
    let options = {};

    if (isInteractive) {
      console.log(`\n--- ${imageFile} ---`);
      const title = await prompt(`Title [${generateTitle(imageFile)}]: `);
      const caption = await prompt('Caption (optional): ');
      const location = await prompt('Location (optional): ');
      const description = await prompt('Description (optional): ');

      options = {
        title: title || generateTitle(imageFile),
        caption,
        location,
        description
      };
    }

    const markdownFile = createPhotoMarkdown(imageFile, options);
    console.log(`  ✓ Created: ${markdownFile}`);
    created++;
  }

  console.log(`\n✓ Successfully created ${created} photo entries!`);
  console.log('\nNext steps:');
  console.log('  1. Review the generated files in content/photos/');
  console.log('  2. Run "node generate-index.js" to update the index');
  console.log('  3. Deploy to Netlify (images will be optimized automatically)');
  console.log('');

  rl.close();
}

// Run main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
