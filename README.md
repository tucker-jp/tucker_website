# Tucker Pippin Personal Website

A clean, editorial-style personal website with integrated CMS. Built with static HTML, vanilla JavaScript, and Decap CMS.

## Architecture

- **Frontend**: Static HTML + CSS + JavaScript (no build step)
- **CMS**: Decap CMS at `/admin` for blog and essay management
- **Content**: Markdown files with YAML frontmatter
- **Hosting**: Netlify (static deployment)
- **Auth**: Netlify Identity + Git Gateway

## Features

- Clean cream/off-white editorial design
- Long-form reading optimized typography
- Client-side Markdown rendering
- CMS-driven Blog and Essays sections
- Static Projects and Photos pages (placeholders)
- Mobile-friendly and accessible
- No build pipeline or bundlers required

## CMS-Driven Content

You can edit these sections via the CMS at `/admin`:

- **Blog** (`/blog.html`) — Shorter posts and updates
- **Essays** (`/essays.html`) — Longer-form writing

## Static Content

These pages require code edits:

- **Home** (`/index.html`) — Landing page with intro
- **Projects** (`/projects.html`) — Portfolio/work showcase
- **Photos** (`/photos.html`) — Photography gallery

## Deployment

See [CMS-SETUP.md](./CMS-SETUP.md) for complete deployment instructions.

**Quick start:**

1. Push to GitHub
2. Deploy to Netlify (no build command, publish from root)
3. Enable Netlify Identity + Git Gateway
4. Invite yourself as a CMS user
5. Log in at `/admin` and start writing

## Local Development

No build step needed. Just open `index.html` in a browser.

**Note**: To test CMS functionality locally, you'll need to run a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## Project Structure

```
/
├── admin/
│   ├── index.html          # Decap CMS interface
│   └── config.yml          # CMS configuration
├── content/
│   ├── blog/
│   │   ├── manifest.json   # Blog post listing
│   │   └── *.md           # Blog post files
│   └── essays/
│       ├── manifest.json   # Essay listing
│       └── *.md           # Essay files
├── uploads/                # CMS-uploaded images
├── index.html              # Homepage
├── blog.html               # Blog listing + single view
├── essays.html             # Essay listing + single view
├── projects.html           # Static projects page
├── photos.html             # Static photos page
├── 404.html                # 404 error page
├── style.css               # Site-wide styles
├── content-loader.js       # Markdown parser + content loader
├── netlify.toml            # Netlify config
├── robots.txt              # SEO
├── CMS-SETUP.md            # Deployment guide
└── README.md               # This file
```

## Content Model

Blog posts and essays use this frontmatter structure:

```yaml
---
title: Post Title
date: 2025-01-15
description: Short description for listings
cover_image: /uploads/image.jpg  # optional
---

Markdown content here...
```

## Image Guidelines

**Important**: Upload web-sized images only (2000–3000px max, under 500KB).

Do NOT upload:
- RAW camera files
- Full-resolution photos
- Files over 5MB

Use [Squoosh.app](https://squoosh.app) or similar to compress images before uploading.

## Customization

### Colors

Edit CSS variables in `style.css`:

```css
:root {
    --cream-bg: #faf8f3;
    --text-primary: #2a2520;
    --accent: #6b5d52;
    /* ... */
}
```

### Typography

Change font stacks in `style.css`:

```css
:root {
    --font-serif: 'Georgia', serif;
    --font-sans: -apple-system, sans-serif;
}
```

### Navigation

Edit the nav links in each HTML file's `<nav class="site-nav">` section.

### Homepage Intro

Edit the `.intro` section in `index.html`.

## Browser Support

Works in all modern browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari/Chrome

## License

All content and code © 2025 Tucker Pippin. All rights reserved.

## Future Enhancements

Potential additions (not currently implemented):

- Auto-generate manifest.json via GitHub Action
- RSS feeds for blog and essays
- Search functionality
- Tags/categories for posts
- Related posts suggestions
- Dark mode toggle
- Print stylesheet
