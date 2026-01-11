# Tucker Pippin Personal Website

A minimalist personal website for writing, projects, and photography. Built with static HTML, vanilla JavaScript, and Decap CMS for content management.

## Overview

This website takes a deliberately simple approach to web development—no frameworks, no bundlers, just clean HTML, CSS, and JavaScript. It features a cream editorial design, CMS-driven content management, and automatic image optimization.

**Live Site**: https://your-site.netlify.app
**Admin Panel**: https://your-site.netlify.app/admin

---

## Architecture

- **Frontend**: Static HTML + CSS + JavaScript (vanilla, no frameworks)
- **CMS**: Decap CMS at `/admin` for blog, projects, and photo management
- **Content**: Markdown files with YAML frontmatter stored in `/content`
- **Build Pipeline**: Image optimization + index generation + automated deployment
- **Hosting**: Netlify (static deployment with automated builds)
- **Auth**: Netlify Identity + Git Gateway for CMS access
- **Design**: Desktop-first with mobile enhancements

---

## Features

### Design & UX
- Clean cream/off-white editorial design with subtle gradients
- Long-form reading optimized typography (Lora serif + Inter sans)
- Mobile-optimized homepage with hero background and large touch targets
- Decorative photo rails on desktop (hidden on mobile/tablet)
- Smooth transitions and hover states throughout
- Accessible focus states and semantic HTML

### Content Management
- **Blog** - Marginal Revolution-style full feed with reading time filters
- **Projects** - Portfolio showcase with status badges and technology tags
- **Photos** - Masonry gallery with lightbox, filters (My Media/Not Mine), and keyboard navigation
- **Daily Quotes** - Rotation system with 876 curated quotes
- Client-side markdown rendering
- Automatic index generation on every deploy
- Contact modal with email display and copy-to-clipboard

### Performance
- Automatic image optimization at build time
- Mobile-specific image versions (800px wide, quality 75)
- Image preloading for critical assets
- Incremental caching (only new/modified images are processed)
- Static HTML with minimal JavaScript
- No framework overhead

### Technical
- No frameworks, no bundlers—just vanilla HTML/CSS/JS
- CSS custom properties for easy theming
- Classic scripts (not ES modules) for maximum compatibility
- SEO optimized with meta tags and semantic structure
- WCAG AA color contrast compliance

---

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
│   ├── projects/
│   │   ├── index.json      # Auto-generated project index
│   │   └── *.md            # Project files
│   └── photos/
│       ├── index.json      # Auto-generated photo index
│       └── *.md            # Photo metadata files (one per photo)
├── js/
│   ├── utils.js            # Shared utilities (frontmatter parser, etc.)
│   └── contact-modal.js    # Contact modal functionality
├── scripts/
│   └── optimize-images.js  # Image optimization + mobile version generation
├── data/
│   └── quotes.json         # Daily quote rotation data (876 quotes)
├── uploads/                # CMS-uploaded images (optimized at build time)
│   ├── *.jpg               # Regular images (auto-optimized to max 2000px)
│   └── *_mobile.jpg        # Mobile versions (800px wide, quality 75)
├── index.html              # Homepage (with mobile hero + nav buttons)
├── blog.html               # Blog feed (Marginal Revolution style)
├── projects.html           # Projects showcase with CMS integration
├── photos.html             # Photo gallery with lightbox and hover overlays
├── 404.html                # 404 error page
├── style.css               # Site-wide styles (includes mobile enhancements)
├── content-loader.js       # Markdown parser + content loader
├── generate-index.js       # Build script (creates index.json files)
├── netlify.toml            # Netlify config (build command, redirects)
├── package.json            # Node dependencies (sharp for image processing)
├── .image-cache.json       # Image optimization cache (auto-generated)
├── robots.txt              # SEO crawling instructions
├── CMS-SETUP.md            # Deployment guide
├── TODO.md                 # Task tracking
├── .claude                 # Claude Code context file
└── README.md               # This file
```

---

## Content Model

### Blog Posts

```yaml
---
title: Post Title
date: 2026-01-15
description: Short description for listings
cover_image: /uploads/image.jpg  # optional
---

Markdown content here...
```

### Projects

```yaml
---
title: Project Name
year: 2026
status: Active  # Active, Completed, or Archived
description: Brief project description
technologies:
  - Technology 1
  - Technology 2
cover_image: /uploads/project.jpg  # optional
link: https://project-url.com  # optional
github: https://github.com/user/repo  # optional
---

Optional markdown details...
```

### Photos

```yaml
---
title: Photo Title
date: 2026-01-15
photo: /uploads/photo.jpg  # required
is_mine: true  # true for your photos, false for artwork/public domain
caption: Optional caption text
location: Optional location
description: Optional longer description
---
```

---

## Getting Started

### Local Development

No build step needed for basic development. Just open `index.html` in a browser.

**To test CMS functionality locally**, run a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

### Deployment

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

---

## Content Management

### CMS-Driven Content

You can edit these sections via the CMS at `/admin`:

- **Blog** ([/blog.html](blog.html)) — Shorter posts and updates (Marginal Revolution style full feed with reading time filters)
- **Projects** ([/projects.html](projects.html)) — Portfolio/work showcase with status badges
- **Photos** ([/photos.html](photos.html)) — Photography gallery with masonry layout and lightbox

### Static Content

These require code edits:

- **Home** ([/index.html](index.html)) — Landing page with intro and daily quote rotation

---

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

**Do NOT upload**:
- RAW camera files (CR2, NEF, ARW, etc.)
- Full-resolution photos from camera (6000px+)
- Files over 10MB (will be optimized but slow to upload)

**Photo Capacity**:
- **Current usage**: 42.43 MB (17 files)
- **Recommended**: 50-150 curated photos for optimal performance
- **Maximum**: 500+ photos before bandwidth concerns
- **Each photo**: ~200-500 KB after optimization
- **Netlify limits**: 100 GB/month bandwidth (free tier)
- **Status**: ✅ Well within limits - you can safely add 200-300 more photos

Pre-compress before upload using [Squoosh.app](https://squoosh.app) for faster uploads.

### iPhone Users: HEIC Format

iPhones save photos in HEIC format by default. **HEIC is not supported by web browsers or the CMS.**

**To upload iPhone photos**:
1. Open Settings > Camera > Formats
2. Select "Most Compatible" instead of "High Efficiency"
3. All future photos will be saved as JPEG

See [CMS-SETUP.md](./CMS-SETUP.md) for more details.

---

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

---

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
    --font-serif: 'Lora', 'Georgia', serif;
    --font-sans: 'Inter', -apple-system, sans-serif;
}
```

### Navigation

Edit the nav links in each HTML file's `<nav class="site-nav">` section.

### Homepage Intro

Edit the `.intro` section in `index.html`.

---

## Code Architecture

### JavaScript Organization

The site uses **classic scripts** (not ES modules) for maximum compatibility with static hosting:

- **`js/utils.js`** - Shared utility functions under `window.siteUtils` namespace
  - `parseFrontmatter()` - YAML frontmatter parser (handles both Unix/Windows line endings)
  - Namespaced to avoid global pollution while maintaining classic script compatibility

- **`content-loader.js`** - Content loading and rendering
  - Uses `window.siteUtils.parseFrontmatter()` for all markdown parsing
  - Loads and caches blog/project/photo content from JSON indexes
  - `markdownToHtml()` - Simple markdown parser
  - `formatDate()` - Human-readable date formatting
  - `calculateReadingTime()` - Estimates reading time (~200 words/min)

- **Inline scripts** - Page-specific functionality (quotes, photo gallery, lightbox)
  - All pages load `js/utils.js` before `content-loader.js` to ensure proper load order

### CSS Architecture

The site uses a **modular CSS** approach with base classes and variants:

- **Base classes**: `.quote-box`, `.btn-base`, `.post-content`
- **Size variants**: `.btn-small`, `.btn-medium`
- **Style variants**: `.btn-accent`
- **Media queries**: Organized in descending order (1400px → 1099px → 768px → 480px)

This reduces CSS duplication and makes styling consistent across the site.

---

## Browser Support

Works in all modern browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari/Chrome

---

## Recent Updates

### January 2026 - Documentation & Mobile CMS Improvements
- ✅ **Comprehensive README** - Complete project documentation with architecture details
- ✅ **TODO tracking** - Task management system with TODO.md file
- ✅ **Claude context file** - Added .claude file for AI-assisted development
- ✅ **Mobile CMS CSS** - Responsive admin interface with 44px touch targets
- ✅ **Photo preview template** - Custom preview for photo uploads with error handling
- ✅ **iPhone documentation** - HEIC format workaround guide

### January 2026 - UI & Content Enhancements
- ✅ **Photo hover overlays** - Title and caption display on hover with gradient overlay
- ✅ **Contact modal** - Email display with copy-to-clipboard functionality
- ✅ **Navigation updates** - Changed Admin to Login, added Contact button
- ✅ **UI refinements** - Increased line-height to 1.8, added subtle box shadows to photos
- ✅ **Fade-in animation** - Subtle 0.3s fade-in for content
- ✅ **Deploy optimization** - Disabled Netlify deploy previews to save build credits
- ✅ **Projects CMS** - Added CMS integration for projects with status badges

### December 2025 - Major Refactoring & Mobile Redesign
- ✅ **Code cleanup** - Removed 326 net lines of duplicate/unused code (-16.6%)
- ✅ **JavaScript refactoring** - Extracted shared frontmatter parser to `js/utils.js`
- ✅ **CSS consolidation** - Created base button/quote classes, reduced style.css by 104 lines
- ✅ **Mobile homepage redesign** - Hero background, large nav buttons, optimized UX
- ✅ **Automatic image optimization** - Build-time compression and mobile version generation
- ✅ **Photo gallery** - Masonry layout with lightbox modal and keyboard navigation

---

## Future Enhancements

Potential additions (not currently implemented):

- **RSS feeds** - Auto-generate RSS for blog and projects
- **Search functionality** - Client-side search across posts
- **Tags/categories** - Taxonomy system for posts and photos
- **Related posts** - Algorithm to suggest similar content
- **Dark mode** - Toggle between light and cream themes
- **Print stylesheet** - Optimized for printing articles
- **PWA support** - Service worker and manifest.json
- **WebP support** - Modern image format alongside JPEG
- **Photo EXIF data** - Auto-extract camera settings from photos
- **Comments system** - Lightweight commenting (utterances, giscus, etc.)

---

## License

All content and code © 2026 Tucker Pippin. All rights reserved.

---

## Support & Issues

For questions or issues with this codebase, refer to:
- [CMS-SETUP.md](./CMS-SETUP.md) - Deployment and CMS configuration
- [TODO.md](./TODO.md) - Current tasks and known issues
- [.claude](.claude) - Development context and guidelines
