# Tucker Pippin Website - Todo List

This file tracks ongoing tasks, known issues, and planned improvements for the website. When working with Claude Code, this list should be updated as tasks are discussed and completed.

## Current Tasks

- [x] Authorize the local Netlify CLI, link the existing production site, and verify a deploy preview (Jul 2026)
- [x] Change Identity registration from open to invite-only after explicit access-control confirmation (Jul 2026)
- [x] Set `TRACKER_ALLOWED_USER_IDS` to Tucker's existing Identity user ID (Jul 2026)
- [x] Migrate all 20 Tracker records, verify category counts, and retain the private Git recovery copy (Jul 2026)
- [x] Create a capture-only Apple Shortcuts token and generate eight signed direct-HTTPS Shortcuts (Jul 2026)
- [ ] Test each updated Shortcut once on macOS and iPhone, including the first-run Shortcuts network permission prompt
- [ ] Add the small Chrome/Edge capture extension after the production endpoint is verified
- [ ] Replace the deprecated Decap/Git Gateway photo and project editor with a custom section of the private workspace
- [ ] Test mobile admin panel after CSS improvements
- [ ] Verify photo previews work correctly after template addition
- [ ] Test iPhone photo upload workflow end-to-end

## Completed ✓

- [x] Preserve and push the exact pre-migration website as `website-before-tracker-migration-2026-07-09` (Jul 2026)
- [x] Build the protected, responsive Tracker web app for seven categories (Jul 2026)
- [x] Add private per-user Blob storage with version-safe writes, soft archive, and JSON export (Jul 2026)
- [x] Add revocable capture-only device tokens and an HTTPS capture endpoint (Jul 2026)
- [x] Add a migration script and dry-run validate all 20 existing private Tracker records (Jul 2026)
- [x] Add automated Tracker schema/storage tests and verify desktop and 390px phone layouts (Jul 2026)
- [x] Audit the generated and installed macOS Shortcuts and identify the iCloud relay limitations (Jul 2026)
- [x] Polish the public navigation, replace the Tracker label with a discreet private-login icon, and fix narrow-screen overflow (Jul 2026)
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
- **Issue**: The authenticated deploy-preview screen still needs Tucker's personal sign-in before the draft can be merged.
- **Status**: Netlify is authorized and linked, Identity is invite-only, all 20 records are migrated, and the real preview capture endpoint passed a create-and-cleanup test. The live website remains unchanged.
- **Action**: Sign in to the visible deploy preview, verify the private interface, then merge the draft.

### macOS Shortcut End-to-End Test
- **Issue**: Running the installed Shortcuts from the command line stopped at an interactive Shortcuts prompt, and Mac UI automation was unavailable in the test session.
- **Status**: Eight direct-save Shortcuts compile and sign successfully, the Apple capture-only token is active, and a harmless clip-test Shortcut is ready to import. Mac UI automation is unavailable in this session.
- **Action**: Import the test Shortcut and approve Apple's first-run network prompt, then run one harmless capture before replacing the existing iCloud versions.

### Legacy CMS Dependency
- **Issue**: Decap's Git Gateway authentication path is deprecated by Netlify and photo publishing still triggers a full Git build.
- **Status**: It remains functional and unchanged for rollback safety.
- **Action**: Move photo/project editing into the private workspace after Tracker production verification, then remove Git Gateway.

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

**Last Updated**: July 2026
