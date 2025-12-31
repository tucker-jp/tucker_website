# Tucker Pippin Personal Website

A clean, editorial-style personal website with integrated CMS. Built with static HTML, vanilla JavaScript, and Decap CMS.

## Architecture

- **Frontend**: Static HTML + CSS + JavaScript (vanilla, no frameworks)
- **CMS**: Decap CMS at `/admin` for blog, essays, and photo management
- **Content**: Markdown files with YAML frontmatter
- **Build Pipeline**:
  - Image optimization (auto-generates mobile versions of bumper images)
  - Index generation (creates searchable JSON indexes)
- **Hosting**: Netlify (static deployment with automated builds)
- **Auth**: Netlify Identity + Git Gateway
- **Responsive Design**: Desktop-first with mobile enhancements at <1100px

## Features

### Design & UX
- Clean cream/off-white editorial design with subtle gradients
- Long-form reading optimized typography (Lora serif + Inter sans)
- Mobile-optimized homepage with hero background and large touch targets
- Decorative photo rails on desktop (hidden on mobile/tablet)
- Smooth transitions and hover states throughout

### Content Management
- CMS-driven Blog, Essays, and Photos sections
- Client-side Markdown rendering with syntax highlighting
- Automatic post/photo index generation on every deploy
- Reading time calculation for blog posts
- Photo gallery with lightbox modal and navigation

### Performance
- Automatic image optimization at build time
- Mobile-specific image versions (800px wide, quality 75)
- Image preloading for critical assets
- Lazy loading for gallery images
- Static HTML with minimal JavaScript

### Technical
- No framework, no bundlers—just vanilla HTML/CSS/JS
- CSS custom properties for easy theming
- Accessible focus states and semantic HTML
- SEO optimized with meta tags and semantic structure

## CMS-Driven Content

You can edit these sections via the CMS at `/admin`:

- **Blog** (`/blog.html`) — Shorter posts and updates
- **Essays** (`/essays.html`) — Longer-form writing
- **Photos** (`/photos.html`) — Photography gallery with masonry layout

## Static Content

These pages require code edits:

- **Home** (`/index.html`) — Landing page with intro
- **Projects** (`/projects.html`) — Portfolio/work showcase

## Deployment

See [CMS-SETUP.md](./CMS-SETUP.md) for complete deployment instructions.

**Quick start:**

1. Push to GitHub
2. Deploy to Netlify with these settings:
   - **Build command**: `npm install && node scripts/optimize-images.js && node generate-index.js`
   - **Publish directory**: `.` (root)
3. Enable Netlify Identity + Git Gateway
4. Invite yourself as a CMS user
5. Log in at `/admin` and start writing

**Build pipeline** (runs automatically on every deploy):
1. `npm install` - Installs Sharp for image processing
2. `node scripts/optimize-images.js` - Optimizes images and creates mobile versions
3. `node generate-index.js` - Generates searchable JSON indexes

The build process is incremental—cached images are skipped, only new/modified images are processed.

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
│   └── config.yml          # CMS configuration (collections, fields, media)
├── content/
│   ├── blog/
│   │   ├── index.json      # Auto-generated post index
│   │   └── *.md            # Blog post files (frontmatter + markdown)
│   ├── essays/
│   │   ├── index.json      # Auto-generated essay index
│   │   └── *.md            # Essay files
│   └── photos/
│       ├── index.json      # Auto-generated photo index
│       └── *.md            # Photo metadata files (one per photo)
├── scripts/
│   └── optimize-images.js  # Image optimization + mobile version generation
├── uploads/                # CMS-uploaded images (optimized at build time)
│   ├── *.jpg               # Regular images (auto-optimized to max 2000px)
│   └── *_mobile.jpg        # Mobile versions (800px wide, quality 75)
├── index.html              # Homepage (with mobile hero + nav buttons)
├── blog.html               # Blog listing + single view
├── essays.html             # Essay listing + single view
├── projects.html           # Static projects page
├── photos.html             # Photo gallery with lightbox
├── 404.html                # 404 error page
├── style.css               # Site-wide styles (includes mobile enhancements)
├── content-loader.js       # Markdown parser + content loader
├── generate-index.js       # Build script (creates index.json files)
├── netlify.toml            # Netlify config (build command, redirects)
├── package.json            # Node dependencies (sharp for image processing)
├── .image-cache.json       # Image optimization cache (auto-generated)
├── robots.txt              # SEO crawling instructions
├── CMS-SETUP.md            # Deployment guide
└── README.md               # This file
```

## Content Model

### Blog Posts and Essays

```yaml
---
title: Post Title
date: 2025-01-15
description: Short description for listings
cover_image: /uploads/image.jpg  # optional
---

Markdown content here...
```

### Photos

```yaml
---
title: Photo Title
date: 2025-01-15
photo: /uploads/photo.jpg  # required
caption: Optional caption text
location: Optional location
description: Optional longer description
---
```

## Image Guidelines & Optimization

### Automatic Optimization
All images uploaded to `/uploads/` are automatically optimized at build time:
- **Large images** (>2000px): Resized to 2000px wide
- **Medium images** (>1600px): Resized to 1600px wide
- **JPEG quality**: 80 (with mozjpeg compression)
- **PNG compression**: Level 9
- **Bumper images**: Mobile versions auto-generated (800px, quality 75)

The optimization is **incremental** (cached) so rebuilds are fast.

### Upload Guidelines
**Recommended**: Upload web-sized images (2000–3000px max)

Do NOT upload:
- RAW camera files (CR2, NEF, ARW, etc.)
- Full-resolution photos from camera (6000px+)
- Files over 10MB (will be optimized but slow to upload)

**Photo Capacity**:
- **Recommended**: 50-150 curated photos for optimal performance
- **Maximum**: 500+ photos before bandwidth concerns
- **Each photo**: ~200-500 KB after optimization
- **Netlify limits**: 100 GB/month bandwidth (free tier)

Pre-compress before upload using [Squoosh.app](https://squoosh.app) for faster uploads.

### Bulk Photo Upload
**CMS limitation**: Decap CMS only supports one photo upload at a time.

**Workarounds**:
1. Upload images directly to `/uploads/` via Git
2. Use CMS Media Library to upload multiple images
3. Manually create markdown files in `content/photos/` for batch uploads

See `scripts/optimize-images.js` for implementation details.

## Responsive Design

The site uses a **desktop-first** approach with mobile enhancements.

### Breakpoints
- **Desktop**: ≥1100px (default, centered column with optional side rails)
- **Tablet**: 768px–1099px (single column, no side rails)
- **Mobile**: <768px (mobile-optimized typography and spacing)

### Desktop Features (≥1100px)
- Decorative photo rails on homepage (visible 1100–1400px)
- Traditional top navigation
- Centered content column (680px max-width)
- Side rails hidden at <1400px

### Mobile Enhancements (<1100px)
**Homepage only:**
- Hero section with background image (`main_bumper_1_mobile.jpg`)
- 92% opacity cream overlay for text readability
- Large, tappable navigation buttons (2x2 grid)
- 80px minimum touch target height
- Photo rails completely hidden
- Optimized images loaded (800px wide instead of 2000px)

**Implementation details:**
- All mobile styles in `@media (max-width: 1099px)` block
- Hero wrapper (`.hero`) added to `index.html` (invisible on desktop)
- Mobile nav buttons hidden on desktop with `display: none`
- Zero changes to desktop layout—pixel-identical

### Accessibility
- Keyboard focus states with `:focus-visible` (3px outline)
- Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, etc.)
- Adequate color contrast (WCAG AA compliant)
- Touch targets ≥44px for mobile
- Screen reader friendly with proper heading hierarchy

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

## Recent Updates

### December 2025
- ✅ **Mobile homepage redesign** - Hero background, large nav buttons, optimized UX
- ✅ **Automatic image optimization** - Build-time compression and mobile version generation
- ✅ **Performance improvements** - 90% smaller images on mobile, preloading, lazy loading
- ✅ **Accessibility enhancements** - Focus states, semantic HTML, WCAG compliance
- ✅ **Photo gallery** - Masonry layout with lightbox modal and keyboard navigation
- ✅ **Code cleanup** - Removed unused CSS, modern syntax (inset), optimized selectors

## License

All content and code © 2025 Tucker Pippin. All rights reserved.

## Future Enhancements

Potential additions (not currently implemented):

- **Bulk photo upload tool** - Node.js script to batch-create photo entries
- **RSS feeds** - Auto-generate RSS for blog and essays
- **Search functionality** - Client-side search across posts
- **Tags/categories** - Taxonomy system for posts and photos
- **Related posts** - Algorithm to suggest similar content
- **Dark mode** - Toggle between light and cream themes
- **Print stylesheet** - Optimized for printing articles
- **PWA support** - Service worker and manifest.json
- **WebP support** - Modern image format alongside JPEG
- **Photo EXIF data** - Auto-extract camera settings from photos
