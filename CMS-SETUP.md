# CMS Setup Guide

This guide walks you through deploying your personal website to Netlify with Decap CMS for content management.

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
   - **Build command**: `node generate-index.js` (auto-generates post indexes)
   - **Publish directory**: `.` (dot means root)
   - **Branch to deploy**: `main`

4. **Deploy**:
   - Click "Deploy site"
   - Wait for deployment to complete (~1 minute)
   - Your site is now live at a random Netlify URL (e.g., `https://random-name-123.netlify.app`)

---

## Step 3: Enable Netlify Identity

Netlify Identity is required for CMS authentication.

1. **Go to Site Settings**:
   - From your site dashboard, click "Site settings"
   - Navigate to "Identity" in the left sidebar

2. **Enable Identity**:
   - Click "Enable Identity"

3. **Configure registration**:
   - Under "Registration preferences", select **Invite only**
   - This prevents random people from signing up to edit your site

4. **Enable Git Gateway**:
   - Scroll down to "Services" → "Git Gateway"
   - Click "Enable Git Gateway"
   - This allows Decap CMS to commit changes directly to your GitHub repo

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

## Step 5: Access the CMS

1. **Navigate to the CMS**:
   - Go to `https://YOUR-SITE.netlify.app/admin`
   - Log in with the email and password you just created

2. **Start creating content**:
   - Click "Blog", "Essays", or "Photos" to create new content
   - Use the Markdown editor for blog/essay posts
   - Upload photos with metadata (title, caption, location, date)
   - Add cover images if desired (see image guidelines below)
   - Click "Publish" → "Publish now" to make it live

3. **How it works**:
   - When you publish, Decap CMS commits the Markdown file to your GitHub repo
   - Netlify automatically rebuilds and deploys your site (usually within 30 seconds)
   - The build step auto-generates post indexes—you never need to touch it
   - Your new post appears on your live site automatically

---

## Step 6: Custom Domain (Optional)

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

**⚠️ UPLOAD WEB-SIZED IMAGES ONLY**

When uploading images via the CMS:

- **Maximum size**: 2000–3000px on the long edge
- **Format**: JPEG or PNG
- **File size**: Keep under 500KB when possible

**DO NOT upload**:
- RAW files (CR2, NEF, DNG, etc.)
- Full-resolution photos straight from your camera
- Files over 5MB

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

## Updating Content via CMS

### Creating a New Blog Post

1. Go to `/admin`
2. Click "Blog" → "New Blog"
3. Fill in:
   - **Title**: Post title
   - **Publish Date**: When it should appear as published
   - **Description**: Short summary (shows in listings)
   - **Cover Image**: Optional header image
   - **Body**: Your post content in Markdown
4. Click "Publish" → "Publish now"

### Creating a New Essay

Same as blog posts, but click "Essays" instead.

### Uploading a New Photo

1. Go to `/admin`
2. Click "Photos" → "New Photos"
3. Fill in:
   - **Title**: Photo title or subject
   - **Upload Date**: When the photo was taken or uploaded
   - **Photo**: Upload the image file (web-sized!)
   - **Caption**: Optional description or story
   - **Location**: Optional location where photo was taken
   - **Description**: Optional additional details
4. Click "Publish" → "Publish now"

Photos appear in a masonry grid layout, sorted by date (newest first).

### Editing Existing Content

1. Go to `/admin`
2. Click "Blog" or "Essays"
3. Click on the post you want to edit
4. Make changes
5. Click "Publish" → "Publish now"

---

## Troubleshooting

### CMS won't load at /admin
- Check that Netlify Identity is enabled
- Verify Git Gateway is enabled
- Clear browser cache and try again

### Can't log in to CMS
- Make sure you accepted the email invitation
- Check that you're using the correct email/password
- Try "Forgot password" to reset

### Changes not appearing on site
- Wait 30–60 seconds for Netlify to rebuild
- Check the "Deploys" tab in Netlify dashboard
- Look for failed builds
- If a new post still doesn't appear, hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Images not loading
- Check that image paths start with `/uploads/`
- Verify images were uploaded via CMS, not manually added
- Make sure image files are web-sized (not RAW)

---

## What's CMS-Driven vs. Static

### CMS-Driven (Editable via /admin)
- **Blog posts** (`content/blog/*.md`)
- **Essays** (`content/essays/*.md`)
- **Photos** (`content/photos/*.md`)

### Static (Edit code directly)
- **Projects page** (`projects.html`)
- **Homepage intro** (`index.html`)
- **Site navigation**
- **All styling** (`style.css`)

---

## Backup and Version Control

All your content is safely stored in your GitHub repository. Every change made through the CMS creates a Git commit, giving you:

- **Full version history**: See what changed and when
- **Easy rollback**: Revert to previous versions if needed
- **Backup**: Your content is never locked in a proprietary system

To view your content's version history:
- Go to your GitHub repo
- Click on any file in `content/blog/` or `content/essays/`
- Click "History" to see all changes

---

## Next Steps

- **Customize the homepage**: Edit `index.html` to update your intro
- **Add your own writing**: Create new blog posts and essays via `/admin`
- **Update Projects/Photos**: When ready, edit `projects.html` and `photos.html`
- **Tweak the design**: Modify `style.css` to adjust colors, fonts, spacing
- **Add analytics** (optional): Integrate Netlify Analytics or privacy-friendly alternatives

---

## Support

This site is designed to be low-maintenance and beginner-friendly. If you encounter issues:

1. Check this guide first
2. Review Netlify's documentation: [docs.netlify.com](https://docs.netlify.com)
3. Check Decap CMS docs: [decapcms.org/docs](https://decapcms.org/docs)

Remember: You have full control over your content and code. Nothing is locked behind a platform.
