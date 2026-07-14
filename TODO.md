# Tucker Pippin Website - Todo List

This file tracks ongoing tasks, known issues, and planned improvements for the website. When working with Claude Code, this list should be updated as tasks are discussed and completed.

## Current Tasks

- [x] Authorize the local Netlify CLI, link the existing production site, and verify a deploy preview (Jul 2026)
- [x] Change Identity registration from open to invite-only after explicit access-control confirmation (Jul 2026)
- [x] Set `TRACKER_ALLOWED_USER_IDS` to Tucker's existing Identity user ID (Jul 2026)
- [x] Migrate all 20 Tracker records, verify category counts, and retain the private Git recovery copy (Jul 2026)
- [x] Create a capture-only Apple Shortcuts token and generate eight signed direct-HTTPS Shortcuts (Jul 2026)
- [x] Verify the authenticated deploy preview and complete one real macOS direct-capture Shortcut test (Jul 2026)
- [x] Import the production Shortcut set and test all eight direct-capture workflows on macOS (Jul 2026)
- [ ] Verify the production Shortcut workflows on iPhone and iPad, including first-run privacy prompts
- [ ] Import the signed “Add to Tracker” Shortcut, assign a Mac hotkey, and verify each menu branch end-to-end
- [ ] Add the small Chrome/Edge capture extension after the production endpoint is verified
- [ ] Verify Site Studio sign-in and one HEIC photo upload on iPhone after production deployment
- [ ] Keep Decap/Git Gateway as the rollback path until Site Studio has been used successfully on normal devices, then retire it

## Completed ✓

- [x] Preserve and push the exact pre-migration website as `website-before-tracker-migration-2026-07-09` (Jul 2026)
- [x] Build the protected, responsive Tracker web app for seven categories (Jul 2026)
- [x] Add private per-user Blob storage with version-safe writes, soft archive, and JSON export (Jul 2026)
- [x] Add revocable capture-only device tokens and an HTTPS capture endpoint (Jul 2026)
- [x] Add a migration script and dry-run validate all 20 existing private Tracker records (Jul 2026)
- [x] Add automated Tracker schema/storage tests and verify desktop and 390px phone layouts (Jul 2026)
- [x] Audit the generated and installed macOS Shortcuts and identify the iCloud relay limitations (Jul 2026)
- [x] Polish the public navigation, replace the Tracker label with a discreet private-login icon, and fix narrow-screen overflow (Jul 2026)
- [x] Build the private Site Studio for photo/project publishing, automatic HEIC/WebP processing, ownership credits, reversible legacy overrides, and portable export (Jul 2026)
- [x] Generate and structurally verify the hybrid “Add to Tracker” Shortcut while retaining fast clip/selection share-sheet actions (Jul 2026)
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

### Tracker Production Activation
- **Issue**: No blocking issue remains; the reviewed draft is ready to merge.
- **Status**: Netlify is authorized and linked, Identity is invite-only, all 20 records load in the authenticated preview, responsive layout checks pass, and the real Shortcut capture test passed. The test record was removed and the library returned to 20 records.
- **Action**: Merge the draft and verify the production URL.

### iPhone and iPad Shortcut Verification
- **Issue**: Apple privacy approvals are local to each device, so the successful Mac tests do not prove the first-run experience on iPhone or iPad.
- **Status**: All eight production Shortcuts passed end-to-end macOS tests and the generated test records were removed.
- **Action**: Run the production share-sheet and prompted-capture workflows once on iPhone and iPad and approve the expected first-run access prompts.

### Legacy CMS Dependency
- **Issue**: Decap's Git Gateway authentication path is deprecated by Netlify and photo publishing still triggers a full Git build.
- **Status**: Site Studio now replaces the routine photo/project workflow; Decap remains functional and unchanged for rollback safety.
- **Action**: Verify Site Studio on Tucker's normal Mac and iPhone workflows, then remove Git Gateway in a later change.

### Mobile CMS Usability
- **Issue**: Admin panel spacing may be inconsistent on mobile devices
- **Status**: Mobile CSS added with 44px touch targets
- **Action**: Test on actual mobile devices and adjust if needed

### iPhone Photo Uploads
- **Issue**: The production iPhone upload flow still needs a real-device check.
- **Status**: Site Studio accepts HEIC/HEIF and converts it to desktop/mobile WebP automatically; local HEIC conversion passed.
- **Action**: Publish one ordinary iPhone HEIC photo through `/studio/` and verify it on the public gallery.

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
- [x] PWA support for the private Tracker (Jul 2026)
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

- [x] Replace routine Decap usage with the custom Site Studio while retaining a rollback path (Jul 2026)
- [x] Add automatic WebP delivery for Site Studio uploads (Jul 2026)
- [ ] Review and update dependencies (Sharp, etc.)
- [ ] Add automated testing for markdown rendering
- [ ] Set up pre-commit hooks for code quality

## Notes

- **Bandwidth**: Currently using 42.43 MB of 100 GB/month (Netlify free tier). Safe to add 200-300 more photos.
- **Build Time**: Typically 30-60 seconds with incremental caching
- **Mobile Support**: Desktop-first design with mobile enhancements at <1100px breakpoint
- **Content Storage**: Markdown files across projects and photos collections

---

**Last Updated**: July 2026
