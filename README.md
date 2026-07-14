# Tucker Pippin Personal Website

A minimalist personal website for projects and photography, plus a private cross-device Tracker for clips, to-dos, books, movies, restaurants, ideas, and quotes. The public site stays static; the private workspace uses small Netlify Functions and Netlify Blobs.

## Overview

The public website takes a deliberately simple approach—no frontend framework or bundler, just clean HTML, CSS, and JavaScript. It features a cream editorial design, CMS-driven content management, and automatic image optimization. The Tracker adds only the small server-side pieces needed for authentication and private storage.

**Live Site**: https://tuckerpippin.com
**Private Site Studio**: https://tuckerpippin.com/studio/
**Legacy Content Admin**: https://tuckerpippin.com/admin
**Private Tracker**: https://tuckerpippin.com/tracker/

---

## Architecture

- **Frontend**: Static HTML + CSS + JavaScript (vanilla, no framework runtime)
- **Tracker**: Installable web app at `/tracker/`, backed by one authenticated API
- **Tracker storage**: Netlify Blobs, separated by Identity user and stored as portable JSON
- **Capture clients**: Revocable, insert-only device tokens for Shortcuts and browser extensions
- **Site Studio**: Private photo/project editor at `/studio/`, with optimized images and content stored in Netlify Blobs
- **Legacy CMS**: Decap CMS at `/admin`, retained as a temporary rollback path
- **Content**: Existing Markdown files remain the baseline; Site Studio records override or extend them without destructive migration
- **Build Pipeline**: Image optimization + index generation + automated deployment
- **Hosting**: Netlify (static deployment with automated builds)
- **Auth**: Invite-only Netlify Identity; Git Gateway is used only by the legacy CMS
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
- **Projects** - Portfolio showcase with status badges and technology tags
- **Photos** - Masonry gallery with lightbox, filters (My Media/Not Mine), and keyboard navigation
- Private Site Studio for adding, editing, crediting, archiving, and restoring photos and projects
- Automatic HEIC/JPEG/PNG/WebP/TIFF conversion into desktop and mobile WebP copies
- Immediate publication without a Git commit or full Netlify deploy
- **Daily Quotes** - Rotation system with 876 curated quotes
- Client-side markdown rendering
- Automatic index generation on every deploy
- Contact modal with email display and copy-to-clipboard

### Private Tracker
- Seven record types: clips, to-dos, books, movies, restaurants, ideas, and quotes
- Search, status filters, editing, and recoverable soft archive
- Responsive desktop and phone interface with installable PWA metadata
- One-time device-token creation and revocation
- Tokens are capture-only: they cannot browse, edit, export, or delete records
- Per-IP rate limiting protects the private API and free-plan usage from request spikes
- JSON export plus a migration script for the existing private Tracker repository
- Version-safe updates so simultaneous edits do not silently overwrite each other

### Performance
- Automatic image optimization at build time
- Mobile-specific image versions (800px wide, quality 75)
- Image preloading for critical assets
- Incremental caching (only new/modified images are processed)
- Static HTML with minimal JavaScript
- No framework overhead

### Technical
- No frontend framework or bundler—just vanilla HTML/CSS/JS
- CSS custom properties for easy theming
- Classic scripts on the public pages; a native module keeps the isolated Tracker maintainable
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
│   ├── optimize-images.js  # Image optimization + mobile version generation
│   ├── migrate-tracker-data.mjs # One-time private Tracker migration
│   └── generate-tracker-shortcuts.py # Signed direct-capture Apple Shortcuts
├── netlify/
│   ├── functions/tracker.mjs # Authenticated Tracker API
│   ├── functions/content.mjs # Site Studio and public-content API
│   └── lib/                # Version-safe Tracker and content storage adapters
├── studio/                 # Private photo/project editor
├── tracker/                # Private Tracker web app and PWA assets
├── tests/                  # Tracker and Site Studio storage tests
├── data/
│   └── quotes.json         # Daily quote rotation data (876 quotes)
├── uploads/                # CMS-uploaded images (optimized at build time)
│   ├── *.jpg               # Regular images (auto-optimized to max 2000px)
│   └── *_mobile.jpg        # Mobile versions (800px wide, quality 75)
├── index.html              # Homepage (with mobile hero + nav buttons)
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

Install dependencies once, then use Netlify's local server so the Tracker Function is available:

```bash
npm ci
npm run dev
```

Visit `http://localhost:8888`. The public pages work normally. Local-only demos are available at `http://localhost:8888/tracker/?demo=1` and `http://localhost:8888/studio/?demo=1`; they never write to production.

Run automated checks with `npm test`.

### Deployment

See [CMS-SETUP.md](./CMS-SETUP.md) for complete deployment instructions.

**Quick start:**

1. Push to GitHub
2. Deploy to Netlify with these settings:
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `.` (root)
3. Enable invite-only Netlify Identity
4. Invite yourself as a CMS user
5. Set the optional `TRACKER_ALLOWED_USER_IDS` environment variable to your Identity user ID
6. Log in at `/tracker/` and `/studio/`; keep `/admin` only as a temporary legacy fallback

**Build pipeline** (runs automatically on every deploy):
1. `npm ci` - Reproduces the locked dependency set
2. `node scripts/optimize-images.js` - Optimizes images and creates mobile versions
3. `node generate-index.js` - Generates searchable JSON indexes

The build process is incremental—cached images are skipped, only new/modified images are processed.

---

## Content Management

### Site Studio

Use the private editor at `/studio/` for:

- **Projects** ([/projects.html](projects.html)) — Portfolio/work showcase with status badges
- **Photos** ([/photos.html](photos.html)) — Photography gallery with masonry layout and lightbox

Site Studio accepts HEIC, JPEG, PNG, WebP, and TIFF images up to 10 MB, produces web-sized WebP copies, preserves the “mine/not mine” distinction and source credits, and publishes directly to Blob storage. These edits do not trigger a site build. Existing Markdown content stays in Git and can be overridden or hidden reversibly. `/admin` remains available as the Decap/Git rollback path until the new workflow has been verified in ordinary use.

### Tracker Data

Tracker records are managed at `/tracker/`. Data is private to the signed-in Identity user. Cross-device capture uses a separate token per capture client or synced device group; revoke one from Tracker Settings if it is lost or retired.

The Apple Shortcuts generator creates a single **Add to Tracker** menu for books, movies, restaurants, ideas, to-dos, and quotes, plus fast share-sheet actions for selected quotes and web links. The production Mac setup intentionally keeps only those three Tracker Shortcuts: use **Control–Option–A** for manual entry, **Save Clip to Tracker** for a shared link, and **Quote From Selection for Tracker** for highlighted text. Optional prompt fields may be left blank. Generated files embed a revocable capture-only token and are restricted to the current macOS user:

```bash
pip install workflowpy-shortcuts
export TRACKER_CAPTURE_TOKEN="paste-capture-only-token-here"
python scripts/generate-tracker-shortcuts.py --output-dir dist/direct-shortcuts
```

Do not share the generated `.shortcut` files; create another device token instead. The generator source itself contains no secret.

Adding, editing, or archiving a Tracker record calls the private Function and writes directly to Blob storage. These routine actions do not run the website build or create a production deploy; deploy usage occurs only when website code or public content is intentionally published.

The old private Git-backed Tracker should remain untouched until the production migration is verified. The pre-migration website is permanently recoverable from the annotated Git tag `website-before-tracker-migration-2026-07-09`.

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

iPhones save photos in HEIC format by default. Site Studio converts HEIC automatically, so no phone setting change is required when uploading through `/studio/`. The legacy Decap editor at `/admin` still needs JPEG or PNG.

**If using the legacy editor**:
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
- Compact stacked header with consistent public navigation and a quiet private-login icon
- Photo rails completely hidden
- Optimized images loaded (800px wide instead of 2000px)

**Implementation details:**
- All mobile styles in `@media (max-width: 1099px)` block
- Hero wrapper (`.hero`) added to `index.html` (invisible on desktop)
- The private route has an accessible label but no public-facing product name

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

The public pages use **classic scripts** for maximum compatibility with static hosting. The self-contained Tracker uses one native module and does not require a bundler:

- **`js/utils.js`** - Shared utility functions under `window.siteUtils` namespace
  - `parseFrontmatter()` - YAML frontmatter parser (handles both Unix/Windows line endings)
  - Namespaced to avoid global pollution while maintaining classic script compatibility

- **`content-loader.js`** - Content loading and rendering
  - Uses `window.siteUtils.parseFrontmatter()` for all markdown parsing
  - Loads and caches project/photo content from JSON indexes
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

### July 2026 - Private Tracker Foundation
- ✅ **Protected Tracker workspace** - Added a responsive, login-only web app for all seven Tracker categories
- ✅ **Cross-device capture API** - Added revocable insert-only tokens suitable for Shortcuts and browser extensions
- ✅ **Private portable storage** - Added per-user Netlify Blob storage, soft archive, JSON export, and conflict-safe writes
- ✅ **Safe migration path** - Added tests, a Git-to-Blob migration script, and an immutable pre-migration website tag
- ✅ **Zero-subscription architecture** - Kept the public site static and reused the site's existing Netlify hosting and Identity
- ✅ **Quiet public integration** - Replaced the product-named login link with an accessible lock icon and removed unnecessary third-party scripts

### July 2026 - Site Studio & Unified Capture
- ✅ **Private Site Studio** - Added login-only photo/project editing without a CMS subscription
- ✅ **Automatic image delivery** - Added HEIC and common-image conversion to desktop/mobile WebP copies
- ✅ **Ownership and credits** - Preserved mine/not-mine filtering with creator, rights, and source fields
- ✅ **Reversible migration** - Kept Git/Decap content untouched as the baseline and rollback path
- ✅ **Unified Shortcut** - Added one Add to Tracker menu while retaining fast clip and selected-quote actions

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

- **RSS feed** - Auto-generate RSS for projects
- **Search functionality** - Client-side search across content
- **Tags/categories** - Taxonomy system for projects and photos
- **Dark mode** - Toggle between light and cream themes
- **Print stylesheet** - Optimized for printing project pages
- **Public-site PWA support** - The private Tracker already has a service worker and manifest
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
