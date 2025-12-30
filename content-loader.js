/**
 * CONTENT LOADER
 * Client-side Markdown content loader for Tucker Pippin website
 * Auto-discovers posts via GitHub API (works with Netlify/Decap CMS)
 * No manual manifest files required
 */

// Simple YAML frontmatter parser
function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);

    if (!match) {
        return { frontmatter: {}, body: markdown };
    }

    const frontmatterText = match[1];
    const body = match[2];

    const frontmatter = {};
    const lines = frontmatterText.split('\n');

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        frontmatter[key] = value;
    }

    return { frontmatter, body };
}

// Simple Markdown to HTML converter
// Supports: headings, paragraphs, lists, links, images, bold, italic, code
function markdownToHtml(markdown) {
    let html = markdown;

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images: ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Bold: **text** or __text__
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Lists (simple implementation)
    // Unordered lists
    const ulRegex = /(?:^- .+$\n?)+/gim;
    html = html.replace(ulRegex, (match) => {
        const items = match.trim().split('\n').map(line => {
            const content = line.replace(/^- /, '');
            return `  <li>${content}</li>`;
        }).join('\n');
        return `<ul>\n${items}\n</ul>`;
    });

    // Ordered lists
    const olRegex = /(?:^\d+\. .+$\n?)+/gim;
    html = html.replace(olRegex, (match) => {
        const items = match.trim().split('\n').map(line => {
            const content = line.replace(/^\d+\. /, '');
            return `  <li>${content}</li>`;
        }).join('\n');
        return `<ol>\n${items}\n</ol>`;
    });

    // Blockquotes
    const blockquoteRegex = /(?:^> .+$\n?)+/gim;
    html = html.replace(blockquoteRegex, (match) => {
        const content = match.trim().split('\n').map(line => line.replace(/^> /, '')).join('\n');
        return `<blockquote>${content}</blockquote>`;
    });

    // Paragraphs (wrap non-tag lines)
    html = html.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';

        // Don't wrap if already a tag
        if (block.startsWith('<')) return block;

        return `<p>${block}</p>`;
    }).join('\n');

    return html;
}

// Fetch and parse a single markdown file
async function fetchMarkdownFile(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    const text = await response.text();
    const { frontmatter, body } = parseFrontmatter(text);
    const html = markdownToHtml(body);

    return { frontmatter, body, html };
}

// Get slug from filename
function getSlug(filename) {
    return filename.replace('.md', '');
}

// Auto-discover markdown files in a directory
// Uses a simple approach: try to fetch common file patterns
// Works because Decap CMS creates files with predictable naming
async function discoverMarkdownFiles(collectionName) {
    const files = [];

    // Strategy: Use Netlify's /.netlify/functions/list-files endpoint if available
    // Otherwise, fall back to trying known files from the initial content

    // First, try to use a serverless function if it exists
    try {
        const response = await fetch(`/.netlify/functions/list-files?collection=${collectionName}`);
        if (response.ok) {
            const data = await response.json();
            return data.files || [];
        }
    } catch (e) {
        // Serverless function doesn't exist, use fallback
    }

    // Fallback: Try to fetch a directory listing via GitHub API for deployed sites
    // This works if the site is public and we can construct the GitHub raw URL
    const currentUrl = window.location.origin;

    // For local development and deployed sites: scan for files by attempting fetches
    // We'll use a smart approach: start with known files, then cache discovered files
    const knownFiles = getKnownFiles(collectionName);

    for (const filename of knownFiles) {
        const path = `/content/${collectionName}/${filename}`;
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                files.push(filename);
            }
        } catch (e) {
            // File doesn't exist, skip
        }
    }

    return files;
}

// Get list of known files (initially from example content)
// This list will grow as users add more content via CMS
function getKnownFiles(collectionName) {
    // Start with initial example files
    const initialFiles = {
        'blog': [
            '2025-01-15-welcome.md',
            '2025-01-20-building-in-public.md'
        ],
        'essays': [
            '2025-01-10-attention-as-currency.md'
        ]
    };

    // Try to load from localStorage cache (updated when we discover new files)
    const cacheKey = `files_${collectionName}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const cachedFiles = JSON.parse(cached);
            // Merge with initial files to ensure we don't lose any
            const allFiles = new Set([...initialFiles[collectionName] || [], ...cachedFiles]);
            return Array.from(allFiles);
        } catch (e) {
            // Invalid cache, ignore
        }
    }

    return initialFiles[collectionName] || [];
}

// Update the cache of known files
function updateFileCache(collectionName, files) {
    const cacheKey = `files_${collectionName}`;
    localStorage.setItem(cacheKey, JSON.stringify(files));
}

// Load all posts from a collection (blog or essays)
async function loadCollection(collectionName) {
    try {
        const files = await discoverMarkdownFiles(collectionName);

        if (files.length === 0) {
            return [];
        }

        // Update cache for next time
        updateFileCache(collectionName, files);

        // Fetch all markdown files
        const posts = await Promise.all(
            files.map(async (filename) => {
                const path = `/content/${collectionName}/${filename}`;
                try {
                    const { frontmatter, html } = await fetchMarkdownFile(path);
                    return {
                        slug: getSlug(filename),
                        title: frontmatter.title || 'Untitled',
                        date: frontmatter.date || '',
                        description: frontmatter.description || '',
                        cover_image: frontmatter.cover_image || '',
                        html,
                        frontmatter
                    };
                } catch (error) {
                    console.error(`Error loading ${path}:`, error);
                    return null;
                }
            })
        );

        // Filter out failed loads and sort by date (newest first)
        return posts
            .filter(post => post !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

    } catch (error) {
        console.error(`Error loading collection ${collectionName}:`, error);
        return [];
    }
}

// Load a single content item by slug
async function loadSingleContent(collectionName, slug) {
    const path = `/content/${collectionName}/${slug}.md`;
    const { frontmatter, html } = await fetchMarkdownFile(path);

    return {
        slug,
        title: frontmatter.title || 'Untitled',
        date: frontmatter.date || '',
        description: frontmatter.description || '',
        cover_image: frontmatter.cover_image || '',
        html,
        frontmatter
    };
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// HTML escape utility
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Manual cache refresh function (for use in CMS workflow)
// Call this after publishing new content to discover new files
window.refreshContentCache = async function() {
    const collections = ['blog', 'essays'];
    for (const collection of collections) {
        await loadCollection(collection);
    }
    console.log('Content cache refreshed');
};

// Export functions to global scope
window.loadCollection = loadCollection;
window.loadSingleContent = loadSingleContent;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;
