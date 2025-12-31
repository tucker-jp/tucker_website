/**
 * Site-wide utility functions
 * Namespaced under window.siteUtils to avoid global pollution
 */
(function() {
    'use strict';

    window.siteUtils = window.siteUtils || {};

    /**
     * Parses frontmatter from markdown content
     * @param {string} markdown - Markdown content with YAML frontmatter
     * @returns {Object} - { frontmatter: Object, body: string }
     */
    window.siteUtils.parseFrontmatter = function(markdown) {
        // Regex handles both Unix (\n) and Windows (\r\n) line endings
        const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
        const match = markdown.match(frontmatterRegex);

        if (!match) {
            return { frontmatter: {}, body: markdown };
        }

        const frontmatterText = match[1];
        const body = match[2];
        const frontmatter = {};

        // Split on both \n and \r\n
        frontmatterText.split(/\r?\n/).forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return;

            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            frontmatter[key] = value;
        });

        return { frontmatter, body };
    };
})();
