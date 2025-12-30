#!/usr/bin/env node

/**
 * GENERATE INDEX FILES
 * Automatically generates index.json files for blog and essay collections
 * Runs on every Netlify deploy to keep content listings up to date
 */

const fs = require('fs');
const path = require('path');

function generateIndex(collectionName) {
    const contentDir = path.join(__dirname, 'content', collectionName);

    // Check if directory exists
    if (!fs.existsSync(contentDir)) {
        console.log(`Directory not found: ${contentDir}`);
        return;
    }

    // Read all .md files from the directory
    const files = fs.readdirSync(contentDir)
        .filter(file => file.endsWith('.md'))
        .sort()
        .reverse(); // Newest first (assuming YYYY-MM-DD- prefix)

    // Write index.json
    const indexPath = path.join(contentDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(files, null, 2));

    console.log(`✓ Generated ${collectionName}/index.json with ${files.length} files`);
}

// Generate indexes for both collections
console.log('Generating content indexes...');
generateIndex('blog');
generateIndex('essays');
console.log('Done!');
