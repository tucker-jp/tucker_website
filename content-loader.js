/**
 * CONTENT LOADER
 * Client-side Markdown content loader for Tucker Pippin website
 * Fetches auto-generated index files to discover posts
 * No manual configuration required
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

// Load all posts from a collection (blog or essays)
async function loadCollection(collectionName) {
    try {
        // Fetch the auto-generated index file
        const indexPath = `/content/${collectionName}/index.json`;
        const indexResponse = await fetch(indexPath);

        if (!indexResponse.ok) {
            console.warn(`No index found at ${indexPath}`);
            return [];
        }

        const files = await indexResponse.json();

        if (!Array.isArray(files) || files.length === 0) {
            return [];
        }

        // Fetch all markdown files
        const posts = await Promise.all(
            files.map(async (filename) => {
                const path = `/content/${collectionName}/${filename}`;
                try {
                    const response = await fetch(path);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${path}`);
                    }
                    const fullMarkdown = await response.text();
                    const { frontmatter, body, html } = parseFrontmatter(fullMarkdown);
                    const htmlContent = markdownToHtml(body);

                    return {
                        slug: getSlug(filename),
                        title: frontmatter.title || 'Untitled',
                        date: frontmatter.date || '',
                        description: frontmatter.description || '',
                        cover_image: frontmatter.cover_image || '',
                        readingTime: calculateReadingTime(fullMarkdown),
                        html: htmlContent,
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
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}`);
    }
    const fullMarkdown = await response.text();
    const { frontmatter, body } = parseFrontmatter(fullMarkdown);
    const html = markdownToHtml(body);

    return {
        slug,
        title: frontmatter.title || 'Untitled',
        date: frontmatter.date || '',
        description: frontmatter.description || '',
        cover_image: frontmatter.cover_image || '',
        readingTime: calculateReadingTime(fullMarkdown),
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

// Calculate reading time from markdown content
// Assumes ~200 words per minute
function calculateReadingTime(markdown) {
    if (!markdown) return 0;

    // Remove frontmatter
    const contentOnly = markdown.replace(/^---[\s\S]*?---/, '');

    // Remove markdown syntax for more accurate word count
    const cleanText = contentOnly
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1') // Images -> alt text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links -> link text
        .replace(/[#*_~`]/g, '') // Remove markdown symbols
        .replace(/\n+/g, ' '); // Newlines to spaces

    const words = cleanText.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const minutes = Math.ceil(wordCount / 200);

    return minutes || 1; // Minimum 1 minute
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

// Export functions to global scope
window.loadCollection = loadCollection;
window.loadSingleContent = loadSingleContent;
window.formatDate = formatDate;
window.calculateReadingTime = calculateReadingTime;
window.escapeHtml = escapeHtml;
