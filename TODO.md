# Tucker Pippin Website - Todo List

This file tracks ongoing tasks, known issues, and planned improvements for the website. When working with Claude Code, this list should be updated as tasks are discussed and completed.

## Current Tasks

- [ ] Test mobile admin panel after CSS improvements
- [ ] Verify photo previews work correctly after template addition
- [ ] Test iPhone photo upload workflow end-to-end

## Completed ✓

- [x] Remove public writing section and blog CMS collection (Mar 2026)
- [x] Create comprehensive README.md documentation (Jan 2026)
- [x] Add mobile-responsive CSS to admin interface (Jan 2026)
- [x] Document iPhone photo upload guidelines (Jan 2026)
- [x] Add custom photo preview template to CMS (Jan 2026)
- [x] Make blog body field optional with empty default (Jan 2026)
- [x] Filter out placeholder characters from rendered blog content (Jan 2026)
- [x] Create TODO.md task tracking file (Jan 2026)
- [x] Create .claude context file for development guidance (Jan 2026)

## Known Issues

### Mobile CMS Usability
- **Issue**: Admin panel spacing may be inconsistent on mobile devices
- **Status**: Mobile CSS added with 44px touch targets
- **Action**: Test on actual mobile devices and adjust if needed

### iPhone Photo Uploads
- **Issue**: HEIC format photos don't display in preview
- **Status**: Documented workaround in CMS-SETUP.md
- **Action**: Users should change iPhone settings to "Most Compatible"

## Future Enhancements

### High Priority
- [ ] RSS feed for projects
- [ ] Client-side search functionality across all content
- [ ] Tags/categories taxonomy for projects and photos

### Medium Priority
- [ ] Dark mode toggle (alternate cream color scheme)
- [ ] Print stylesheet for project pages
- [ ] Photo EXIF data extraction and display

### Low Priority / Nice to Have
- [ ] PWA support (service worker and manifest.json)
- [ ] WebP image format support alongside JPEG
- [ ] Comments system (utterances or giscus integration)
- [ ] Analytics integration (privacy-focused, e.g., Plausible)
- [ ] Newsletter signup integration
- [ ] Social media sharing buttons

## Performance Optimizations

### Completed
- [x] Image optimization at build time (Dec 2025)
- [x] Mobile-specific image versions (Dec 2025)
- [x] Incremental build caching (Dec 2025)
- [x] Static HTML delivery (no server-side processing)

### Future
- [ ] Lazy loading for images below the fold
- [ ] Font subsetting for faster typography loading
- [ ] Service worker for offline access
- [ ] Critical CSS inlining

## Content Goals

- [ ] Add 50+ more photos to gallery
- [ ] Add 3-5 more projects to portfolio
- [ ] Expand quote rotation to 1000+ quotes

## Technical Debt

- [ ] Consider migrating to Sveltia CMS (modern Decap alternative with better mobile support)
- [ ] Evaluate modern image formats (AVIF, WebP) support
- [ ] Review and update dependencies (Sharp, etc.)
- [ ] Add automated testing for markdown rendering
- [ ] Set up pre-commit hooks for code quality

## Notes

- **Bandwidth**: Currently using 42.43 MB of 100 GB/month (Netlify free tier). Safe to add 200-300 more photos.
- **Build Time**: Typically 30-60 seconds with incremental caching
- **Mobile Support**: Desktop-first design with mobile enhancements at <1100px breakpoint
- **Content Storage**: Markdown files across projects and photos collections

---

**Last Updated**: March 2026
