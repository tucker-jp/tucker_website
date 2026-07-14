# Tucker Pippin Personal Website - Codex Context

This file provides context and guidelines for Codex when working on this project.

## Project Overview

This is a minimalist personal website built with vanilla HTML, CSS, and JavaScript, plus a private Tracker and private Site Studio backed by Netlify Functions and Netlify Blobs. The public site remains static and features a cream editorial design. Decap CMS is retained only as the rollback path for the original Markdown content.

**Key Philosophy**: Simplicity over complexity. Prefer readable, maintainable code over clever abstractions.

---

## Architecture Decisions

### Why No Frameworks?
- **Maximum compatibility**: Works everywhere without build steps
- **Long-term maintainability**: No framework churn or breaking changes
- **Learning value**: Pure web fundamentals
- **Performance**: Zero framework overhead
- **Simplicity**: Easy to understand and modify

### Why Classic Scripts (Not ES Modules)?
- **Static hosting compatibility**: No bundler needed
- **Immediate execution**: Works in any browser without module support
- **Shared utilities**: `window.siteUtils` namespace for global access
- **No build step**: Open `index.html` and it just works

### Why Decap CMS? (Legacy Only)
- **Git-based**: Content stored as markdown files in repository
- **No database**: Everything version controlled
- **Free**: No CMS subscription costs
- **Open source**: Full control and customization
- **Editorial workflow**: Built-in draft/review/publish states

Git Gateway is deprecated. Preserve `/admin` until the custom private content editor is verified, but do not build new features around Git Gateway.

### Why Netlify Functions + Blobs for Tracker and Site Studio?
- **No new subscription**: Reuses the site's existing low-volume Netlify footprint
- **Cross-device**: A web app and HTTPS capture endpoint work on macOS, iOS, Windows, and browsers
- **Narrow credentials**: Device tokens are insert-only and revocable
- **Portable**: Records are JSON and can be exported at any time
- **Safe updates**: ETag conditions prevent silent overwrites
- **Low-cost publishing**: Tracker and Site Studio writes do not trigger Git commits or website builds
- **Image handling**: Site Studio converts HEIC and common image formats to web-sized WebP variants

---

## Important Development Guidelines

### Always Update Documentation

**CRITICAL**: When making significant changes to the codebase, ALWAYS update these files:

1. **README.md** - Update architecture, features, or setup instructions if changed
2. **TODO.md** - Add new tasks when discussed, mark as complete `[x]` when finished
3. **CMS-SETUP.md** - Update if deployment or CMS configuration changes

### Todo Management Protocol

**When user discusses a new task or improvement**:
1. Add it to TODO.md under "Current Tasks" with `- [ ]` unchecked format
2. Be specific and actionable in task descriptions
3. Include enough context that it's clear what needs to be done

**When a task is completed**:
1. Move it to "Completed ✓" section with `- [x]` checked format
2. Add completion date in parentheses (e.g., "Jan 2026")
3. Keep completed items for project history

**When a bug or issue is discovered**:
1. Add to "Known Issues" section with status and action items
2. Document the cause if known
3. Note any workarounds

---

## Common Operations

### Adding Photos
1. User logs into `/studio/`
2. Uploads a supported image up to 10 MB (HEIC is accepted)
3. Sets `is_mine` to true for personal photos, false for artwork
4. Site Studio creates desktop and mobile WebP copies automatically
5. Photo appears on `/photos.html`

### Optimizing Images
- Automatic during Netlify build via `scripts/optimize-images.js`
- Uses Sharp library for compression
- Creates mobile versions for bumper images
- Incremental caching via `.image-cache.json`
- Only processes new/modified images

### Testing Locally
```bash
npm ci
npm test
npm run dev

# Public site: http://localhost:8888
# Local-only Tracker demo: http://localhost:8888/tracker/?demo=1
# Local-only Site Studio demo: http://localhost:8888/studio/?demo=1
```

### Deploying
- Push to GitHub
- Netlify auto-builds and deploys
- Build command: `npm ci && npm run build`
- Typical build time: 30-60 seconds

---

## File Organization Patterns

### HTML Files
- All pages in root directory
- Load `js/utils.js` first, then `content-loader.js`
- Inline scripts for page-specific logic
- Consistent nav structure across pages

### CSS Architecture
- Single `style.css` file for entire site
- CSS custom properties for theming
- Base classes with variants (`.btn-base`, `.btn-small`, `.btn-accent`)
- Media queries in descending order (1400px → 768px → 480px)
- Mobile-first within each breakpoint

### JavaScript Organization
- `js/utils.js` - Shared utilities (`window.siteUtils` namespace)
- `content-loader.js` - Content fetching and markdown parsing
- `js/contact-modal.js` - Contact modal functionality
- Inline scripts in HTML for page-specific features

### Content Structure
```
content/
├── projects/*.md   # Project descriptions
└── photos/*.md     # Photo metadata
```

Each folder has auto-generated `index.json` for fast content discovery.

### Tracker Structure
```
tracker/                    # Private Tracker PWA
netlify/functions/tracker.mjs # Authenticated API and capture endpoint
netlify/lib/                # Schema and version-safe Blob repository
tests/                      # Node test suite
scripts/migrate-tracker-data.mjs # One-time migration helper
```

Tracker records are private per Identity user. Never commit device tokens, Netlify access tokens, private Tracker data, or production exports. Keep the pre-migration website tag and old private Tracker repository until production counts are verified.

### Site Studio Structure
```
studio/                         # Private photo/project editor
netlify/functions/content.mjs  # Authenticated editor + public content/assets
netlify/lib/content-store.mjs  # Version-safe content and image Blob repository
tests/content-store.test.mjs   # Content normalization and storage tests
```

Original Markdown content remains in Git. Studio entries and reversible overrides live in Netlify Blobs and should be backed up with the Studio export. Keep `/admin` and Git Gateway available until the Studio workflow is verified on Tucker's normal devices.

---

## Responsive Design Approach

### Breakpoints
- **1400px**: Hide photo rails
- **1099px**: Switch to mobile layout (hero, nav buttons)
- **768px**: Tablet adjustments (typography scaling)
- **480px**: Mobile adjustments (stacked layouts)

### Mobile Strategy
- Desktop-first base styles
- Mobile enhancements in media queries
- Touch targets ≥44px on mobile
- 16px font size to prevent iOS auto-zoom
- Optimized images (800px wide) for mobile

---

## Decap CMS Administration

### Accessing Admin
- URL: `/admin`
- Auth: Netlify Identity
- Requires invite from site owner

### Collections
1. **Projects** - Portfolio/work showcase
2. **Photos** - Photography gallery

### Mobile CMS Issues
- Default Decap CMS has poor mobile UX
- Custom CSS added to `admin/index.html` fixes:
  - Button sizes (44px minimum)
  - Input padding (12px)
  - Font size (16px to prevent zoom)
  - Modal widths (95vw max)
  - Vertical stacking of controls

### Photo Preview Template
- Custom preview shows image immediately after upload
- Uses `getAsset()` for in-memory file access
- Displays all metadata fields
- Error handling for HEIC/unsupported formats

---

## Known Limitations and Workarounds

### iPhone HEIC Photos
**Site Studio**: Converts HEIC/HEIF automatically
**Legacy Decap**: Still requires JPEG/PNG; the conversion workaround remains in CMS-SETUP.md

### Decap CMS Mobile Usability
**Problem**: Default UI not optimized for mobile
**Solution**: Custom responsive CSS in `admin/index.html`
**Status**: Implemented Jan 2026

### Build Time for Large Images
**Problem**: First build with many large images can be slow
**Solution**: Incremental caching, recommend pre-compressing images
**Workaround**: Use Squoosh.app before upload

---

## Code Style Preferences

### HTML
- Semantic tags (`<nav>`, `<main>`, `<article>`, `<footer>`)
- Descriptive class names (`.project-card`, `.photo-caption-overlay`)
- Minimal inline styles (use classes instead)
- Comments for major sections

### CSS
- Custom properties for theming
- Mobile-last media queries (desktop default)
- Base classes with variants pattern
- Consistent spacing using CSS variables

### JavaScript
- Classic scripts, not modules
- Descriptive function and variable names
- Comments for complex logic
- Namespace shared utilities (`window.siteUtils`)
- Avoid global pollution

---

## Testing and Validation

### Before Committing
- [ ] Test on desktop browser (Chrome/Firefox)
- [ ] Test on mobile device (actual phone, not just DevTools)
- [ ] Verify all internal links work
- [ ] Check console for JavaScript errors
- [ ] Validate images load correctly
- [ ] Test CMS functionality if admin changes were made

### After Deploying
- [ ] Verify build succeeded on Netlify
- [ ] Check live site loads correctly
- [ ] Test new features in production
- [ ] Verify image optimization ran successfully
- [ ] Check that new content appears correctly

### CMS Testing Checklist
- [ ] Create new project entry in Site Studio
- [ ] Upload JPEG and HEIC photos in Site Studio
- [ ] Edit existing content
- [ ] Verify mine/not-mine credits and public rendering
- [ ] Verify save and publish workflow
- [ ] Check that changes appear on live site

---

## Performance Considerations

### Current Stats
- **Upload folder**: 42.43 MB (17 files)
- **Markdown files**: 18 across all collections
- **Bandwidth**: Well within Netlify free tier (100 GB/month)
- **Build time**: 30-60 seconds (with caching)

### Optimization Recommendations
- Keep photo count between 50-150 for optimal performance
- Pre-compress images before upload (use Squoosh.app)
- Each optimized photo should be 200-500 KB
- Can safely add 200-300 more photos before bandwidth concerns

### Image Optimization Details
- Large images (>2000px) → resized to 2000px
- Medium images (>1600px) → resized to 1600px
- JPEG quality: 80 (mozjpeg compression)
- PNG: Level 9 compression
- Mobile versions: 800px, quality 75

---

## Troubleshooting Guide

### Build Fails
1. Check Netlify build log for errors
2. Verify `package.json` dependencies are correct
3. Test `scripts/optimize-images.js` locally
4. Check for corrupted images in `/uploads`

### Images Not Displaying
1. For legacy content, verify the path starts with `/uploads/` and the file exists
2. For Site Studio content, confirm the upload finished and the asset URL starts with `/api/content/assets/`
3. Site Studio accepts HEIC/JPEG/PNG/WebP/TIFF; legacy Decap accepts JPEG/PNG
4. Check the browser console for 404 errors

### CMS Login Issues
1. Verify Netlify Identity is enabled
2. Check user has been invited
3. For `/admin` only, confirm the legacy Git Gateway is still configured
4. Try clearing browser cache/cookies

### Content Not Updating
1. For Site Studio changes, wait up to 30 seconds for the public cache and hard refresh
2. For legacy Decap changes, check if `index.json` was regenerated and frontmatter is valid YAML
3. Clear the browser cache
4. Check the Netlify deploy log only for legacy/code deployments

### Mobile Layout Issues
1. Test actual device, not just DevTools
2. Check media query breakpoints in style.css
3. Verify viewport meta tag is present
4. Test touch targets are ≥44px

---

## Useful Commands

```bash
# Local development server
npm run dev

# Automated Tracker checks
npm test

# Check upload folder size
du -sh uploads

# Count markdown files
find content -name "*.md" | wc -l

# Test image optimization locally
node scripts/optimize-images.js

# Generate content indexes locally
node generate-index.js

# Check Node version (requires >=18.0.0)
node --version

# Install dependencies
npm ci
```

---

## Project History

### July 2026
- Added the private Tracker web app, authenticated API, and per-user Blob storage
- Added capture-only device tokens, JSON export, and the existing-data migration script
- Preserved the exact pre-migration website in an annotated Git tag
- Added private Site Studio with direct photo/project publishing, HEIC/WebP processing, credits, export, and reversible legacy overrides
- Added the hybrid “Add to Tracker” Shortcut generator and kept fast share-sheet capture actions
- Hardened optional Shortcut prompts, installed the unified Mac workflow with Control–Option–A, and removed obsolete category/test Shortcuts
- Retained Decap/Git Gateway only as a verified rollback surface

### January 2026
- Added comprehensive documentation (README, TODO, AGENTS.md)
- Implemented mobile-responsive CMS interface
- Added custom photo preview template
- Documented iPhone HEIC workaround

### December 2025
- Major code refactoring (-326 lines)
- Mobile homepage redesign with hero background
- Automatic image optimization pipeline
- Photo gallery with masonry layout and lightbox
- CSS consolidation and base class system

### Earlier
- Initial site launch
- Decap CMS integration
- Quote rotation system (876 quotes)
- Contact modal with email copy
- Projects CMS integration

---

## When to Ask for Clarification

1. **User intent is ambiguous** - Ask before making assumptions
2. **Multiple valid approaches** - Present options and let user choose
3. **Breaking changes** - Confirm before modifying core functionality
4. **Architectural decisions** - Discuss trade-offs before implementing
5. **Design preferences** - Check color, spacing, or layout choices
6. **Content decisions** - Verify wording for user-facing text

---

## Resources

- **Decap CMS Docs**: https://decapcms.org/docs/
- **Netlify Docs**: https://docs.netlify.com/
- **Sharp (image optimization)**: https://sharp.pixelplumbing.com/
- **Markdown Guide**: https://www.markdownguide.org/
- **Squoosh (image compression)**: https://squoosh.app/

---

**Last Updated**: January 2026

**Maintainer**: Tucker Pippin
**Primary Assistant**: Codex (Sonnet 4.5)
