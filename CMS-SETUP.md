# CMS Setup Guide

This guide covers the public website, the private Site Studio, the legacy Decap fallback, and the private Tracker workspace.

> **July 2026 status:** `/studio/` is the primary photo/project editor. It uses invite-only Netlify Identity, a narrowly scoped Function, and Netlify Blob storage—the same low-maintenance pattern as `/tracker/`. `/admin` and Git Gateway remain unchanged as a temporary rollback path. Routine Studio and Tracker saves do not trigger Netlify builds and are designed to fit this low-volume personal site within the free allowance.

## Prerequisites

- A GitHub account
- A Netlify account (free tier works fine)

---

## Step 1: Push to GitHub

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Tucker Pippin website"
   ```

2. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Name it `tucker-pippin-website` (or your preferred name)
   - Keep it **public** or **private** (either works)
   - Do NOT initialize with README, .gitignore, or license

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/tucker-pippin-website.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy to Netlify

1. **Log into Netlify**: [app.netlify.com](https://app.netlify.com)

2. **Import your repository**:
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub account
   - Select your `tucker-pippin-website` repository

3. **Configure build settings**:
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `.` (dot means root)
   - **Branch to deploy**: `main`

4. **Deploy**:
   - Click "Deploy site"
   - Wait for deployment to complete (~1 minute)
   - Your site is now live at a random Netlify URL (e.g., `https://random-name-123.netlify.app`)

---

## Step 3: Enable Netlify Identity

Netlify Identity is required for Site Studio, the legacy CMS, and the private Tracker.

1. **Go to Site Settings**:
   - From your site dashboard, click "Site settings"
   - Navigate to "Identity" in the left sidebar

2. **Enable Identity**:
   - Click "Enable Identity"

3. **Configure registration**:
   - Under "Registration preferences", select **Invite only**
   - This prevents random people from signing up to edit your site

4. **Keep Git Gateway only while `/admin` is still in use**:
   - Scroll down to "Services" → "Git Gateway"
   - Click "Enable Git Gateway"
   - This allows Decap CMS to commit changes directly to your GitHub repo
   - Git Gateway is deprecated; do not build new features around it

---

## Step 4: Invite Yourself as a CMS User

1. **Invite a user**:
   - Go to the "Identity" tab in your Netlify site dashboard
   - Click "Invite users"
   - Enter your email address
   - Click "Send"

2. **Accept the invitation**:
   - Check your email for the invitation
   - Click "Accept the invite"
   - Set a password for your CMS account

---

## Step 5: Access Site Studio

1. **Navigate to Site Studio**:
   - Go to `https://YOUR-SITE.netlify.app/studio/`
   - Log in with the email and password you just created

2. **Start creating content**:
   - Choose **Photos** or **Projects**
   - Add or edit the entry and click **Publish**
   - For photos that are not yours, choose **Not mine** and add the creator, source link, and rights/credit

3. **How it works**:
   - Site Studio converts supported uploads to desktop and mobile WebP copies
   - The entry is saved directly to Netlify Blobs and appears on the public site immediately
   - No Git commit, rebuild, or new production deploy is created
   - Existing Git/Decap entries are left untouched; Studio changes act as reversible overrides

4. **Legacy rollback path**:
   - `/admin` still opens Decap and can manage the original Markdown content
   - Keep Git Gateway enabled until Site Studio has been used successfully on your normal devices

---

## Step 6: Activate the Private Tracker

1. **Open the Tracker**:
   - Visit `https://YOUR-SITE.netlify.app/tracker/`
   - Sign in with the same invite-only Identity account

2. **Restrict Tracker access to Tucker's account**:
   - Copy the user's UUID from the Netlify Identity user list
   - Add a Netlify environment variable named `TRACKER_ALLOWED_USER_IDS`
   - Set its value to that UUID; multiple IDs may be comma-separated
   - Trigger a deploy so the Function receives the new value

3. **Migrate the existing private Tracker**:
   - Keep the existing `~/tracker-data` Git repository unchanged as a recovery copy
   - First run `TRACKER_MIGRATION_DRY_RUN=1 npm run migrate:tracker`; this validates and counts every source record without credentials or writes
   - In a local terminal, set `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`, and `TRACKER_OWNER_ID`
   - Never paste the Netlify token into chat, source files, or Git
   - Run `npm run migrate:tracker`
   - The script imports compatible records, preserves IDs and timestamps, skips conflicts by default, and prints counts without printing private record contents
   - Compare the imported/indexed count with the source repository before relying on the new copy

4. **Connect personal capture devices**:
   - In Tracker, open **Settings** → **Connect a device**
   - Use one token per Shortcut, browser extension, or personal device
   - The token is shown once and can only add records; it cannot read, edit, export, or delete
   - Revoke a token immediately if a device is lost or retired

The Tracker Function also applies a per-IP request limit before execution. This protects the free-plan allowance from accidental loops and ordinary single-source abuse without affecting normal personal use.

The capture endpoint is `POST /api/tracker/capture`. It accepts JSON plus `Authorization: Bearer YOUR_DEVICE_TOKEN`. Direct HTTPS capture is preferred over the old iCloud text-file relay because it records the real capture time, works from Windows and browser extensions, and reports success or failure immediately.

Tracker captures and edits write directly to private Blob storage. They do not trigger a site build or production deploy. Only an intentional code/content publication spends a production-deploy allowance.

## Step 7: Custom Domain (Optional)

To use `tuckerpippin.com` instead of the Netlify subdomain:

1. **Purchase a domain** (if you don't already own it):
   - Use Namecheap, Google Domains, Cloudflare, etc.

2. **Add custom domain in Netlify**:
   - Go to "Site settings" → "Domain management"
   - Click "Add custom domain"
   - Enter `tuckerpippin.com`
   - Netlify will provide DNS instructions

3. **Update DNS records** (at your domain registrar):
   - Add an **A record** pointing to Netlify's load balancer IP
   - Or add a **CNAME record** pointing to your Netlify subdomain
   - Follow the exact instructions Netlify provides

4. **Enable HTTPS**:
   - Netlify automatically provisions an SSL certificate via Let's Encrypt
   - This usually takes a few minutes after DNS propagation

---

## Important: Image Upload Guidelines

**Site Studio handles web sizing automatically.**

When uploading images via `/studio/`:

- **Maximum file size**: 10 MB
- **Formats**: HEIC/HEIF, JPEG, PNG, WebP, or TIFF
- **Output**: WebP copies sized for desktop (up to 2000px) and mobile (up to 900px)

**DO NOT upload**:
- RAW files (CR2, NEF, DNG, etc.)
- Files over 10 MB

**Photo Capacity Guidelines**:
- **Recommended**: 50-150 curated photos for optimal performance
- **Maximum**: 500+ photos before bandwidth/storage concerns
- **Each photo**: ~200-500 KB when web-optimized
- **Netlify limits**: 100 GB/month bandwidth (free tier)

**Why web-sized images matter**:
- Large images slow down your website
- They consume unnecessary bandwidth
- Better user experience on mobile devices

**How to resize images**:
- **Mac**: Use Preview → Tools → Adjust Size
- **Windows**: Use Paint or Photos app
- **Online**: Use [Squoosh.app](https://squoosh.app) for compression

---

### For iPhone Users: Photo Upload Guidelines

Site Studio accepts iPhone HEIC/HEIF photos and converts them automatically. You can select the photo normally from Safari or another personal browser; no Camera setting change is required.

#### Legacy `/admin` only: Option 1

This will make all future photos compatible with the web:

1. Open **Settings** on your iPhone
2. Scroll down and tap **Camera**
3. Tap **Formats**
4. Select **"Most Compatible"** instead of "High Efficiency"
5. All future photos will now be saved as JPEG

#### Legacy `/admin` only: Option 2

If you need to upload existing HEIC photos:

1. Open the photo in the Photos app
2. Tap the **Share** button (square with arrow)
3. Choose **"Save to Files"**
4. The photo will automatically convert to JPEG
5. Upload the converted version from Files app

#### Legacy `/admin` only: Option 3

- **Squoosh.app** - Upload HEIC, download as JPEG
- **HEIC to JPEG** apps from App Store
- Photo editing apps that export as JPEG

#### Why HEIC Doesn't Work

HEIC (High Efficiency Image Format) offers better compression than JPEG, but:
- Most web browsers cannot display HEIC files
- Decap CMS cannot preview HEIC images
- Your website visitors won't see the images
- The CMS preview will show error messages

Only convert to JPEG first when using the legacy `/admin` editor. `/studio/` accepts HEIC directly.

#### File Size Recommendations for iPhone Photos

After converting to JPEG:
- **Ideal**: 2-5 MB per photo
- **Maximum**: 10 MB per photo
- Use Squoosh.app to compress if files are larger
- iPhone photos are typically 2000-4000px, which is fine

---

## Updating Content via Site Studio

### Uploading a New Photo

1. Go to `/studio/`
2. Choose **Photos** → **Add photo**
3. Fill in:
   - **Title**: Photo title or subject
   - **Upload Date**: When the photo was taken or uploaded
   - **Photo**: Choose an image up to 10 MB; HEIC is accepted
   - **Ownership**: Choose **My photo** or **Not mine**
   - **Caption**: Optional description or story
   - **Location**: Optional location where photo was taken
   - **Description**: Optional additional details
4. Click **Publish**

Photos appear in a masonry grid layout, sorted by date (newest first).

### Editing Existing Content

1. Go to `/studio/`
2. Click "Projects" or "Photos"
3. Click on the post you want to edit
4. Make changes
5. Click **Publish**

---

## Troubleshooting

### Site Studio won't load at /studio
- Check that Netlify Identity is enabled
- Verify your user ID is included in `TRACKER_ALLOWED_USER_IDS` if that allowlist is set
- Clear browser cache and try again

### Can't log in to Site Studio
- Make sure you accepted the email invitation
- Check that you're using the correct email/password
- Try "Forgot password" to reset

### Changes not appearing on site
- Wait up to 30 seconds for the short public-content cache
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- If the Studio save itself failed, retry from the editor; no deployment is required

### Images not loading
- Confirm the upload finished and the entry reported **published**
- Use a supported image format and keep the file under 10 MB
- RAW camera files are not supported

---

## What's Studio-Managed vs. Static

### Site Studio (Editable via /studio)
- **Projects** — new records and reversible overrides in Netlify Blobs
- **Photos** — metadata plus optimized image copies in Netlify Blobs

The original `content/projects/*.md` and `content/photos/*.md` files remain the Git/Decap baseline.

### Static (Edit code directly)
- **Projects page** (`projects.html`)
- **Homepage intro** (`index.html`)
- **Site navigation**
- **All styling** (`style.css`)

---

## Backup and Version Control

Original Decap content remains stored in GitHub with its full history. New Site Studio entries and overrides are stored in Netlify Blobs and can be downloaded from **Site Studio → Export**. This keeps the new editor fast while preserving portability and the original Git rollback path.

Legacy Decap changes still create Git commits, giving you:

- **Full version history**: See what changed and when
- **Easy rollback**: Revert to previous versions if needed
- **Backup**: Your content is never locked in a proprietary system

To view your content's version history:
- Go to your GitHub repo
- Click on any file in `content/projects/` or `content/photos/`
- Click "History" to see all changes

Tracker data is additionally portable through **Tracker → Settings → Download JSON export**. Archived records are included. Before this migration began, the exact website state was preserved in Git as `website-before-tracker-migration-2026-07-09`; restoring that tag returns the code and public website to the pre-Tracker version. Site Studio content must be restored from its export, and Tracker records must be restored from their export or the retained private Tracker repository—not from the website tag.

---

## Next Steps

- **Customize the homepage**: Edit `index.html` to update your intro
- **Update Projects/Photos**: Add or edit entries via `/studio/`
- **Tweak the design**: Modify `style.css` to adjust colors, fonts, spacing
- **Add analytics** (optional): Integrate Netlify Analytics or privacy-friendly alternatives

---

## Support

This site is designed to be low-maintenance and beginner-friendly. If you encounter issues:

1. Check this guide first
2. Review Netlify's documentation: [docs.netlify.com](https://docs.netlify.com)
3. Check Decap CMS docs: [decapcms.org/docs](https://decapcms.org/docs)

Remember: You have full control over your content and code. Nothing is locked behind a platform.
