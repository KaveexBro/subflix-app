# Subflix Vercel Deployment Guide

This guide explains how to deploy Subflix to Vercel as a static site. Vercel is ideal for React apps and provides free hosting with automatic deployments from GitHub.

## Why Vercel Over Firebase Hosting?

While Firebase is great for full-stack apps, Vercel is better optimized for static React apps with:
- Automatic builds from Git commits
- Preview deployments for pull requests
- Edge functions for serverless computing
- Built-in analytics and monitoring
- Faster CDN for React apps

## Prerequisites

- GitHub account with your Subflix repository
- Vercel account (free at vercel.com)
- Git configured locally

## Step 1: Prepare Your Repository

### 1.1 Ensure Configuration Files Are Present

The following files should be in your project root:

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- `package.json` - Updated with correct build script

These are already created in your project.

### 1.2 Verify Build Script

Check that `package.json` has the correct build command:

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

This builds only the React frontend to the `dist/public` directory.

### 1.3 Push to GitHub

If not already done, push your project to GitHub:

```bash
git add .
git commit -m "Add Vercel configuration for static deployment"
git push origin main
```

## Step 2: Connect to Vercel

### 2.1 Sign Up/Login to Vercel

Visit [vercel.com](https://vercel.com) and sign in with GitHub.

### 2.2 Import Project

1. Click **"Add New..."** > **"Project"**
2. Select **"Import Git Repository"**
3. Find and select your `subflix-app` repository
4. Click **"Import"**

### 2.3 Configure Project Settings

Vercel will auto-detect your project as a Vite app. Verify:

- **Framework Preset:** Vite
- **Build Command:** `pnpm build` (or `npm run build`)
- **Output Directory:** `dist/public`
- **Install Command:** `pnpm install` (or `npm install`)

### 2.4 Add Environment Variables

For Firebase integration, add your environment variables:

1. Go to **Settings > Environment Variables**
2. Add each Firebase variable:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** These must start with `VITE_` to be accessible in the frontend.

### 2.5 Deploy

Click **"Deploy"** and wait for the build to complete. Vercel will provide a URL like:

```
https://subflix-app.vercel.app
```

## Step 3: Verify Deployment

### 3.1 Check the Live Site

Visit your Vercel URL and verify:
- React app loads (not server code)
- Dark theme displays correctly
- Search bar works
- Upload button opens modal
- All pages accessible

### 3.2 Test Features

- **Browse:** View subtitle grid
- **Search:** Filter by title
- **Upload:** Test subtitle upload (stored in IndexedDB)
- **Admin Dashboard:** Access if using mock admin ID
- **Creator Dashboard:** View submissions

### 3.3 Check Browser Console

Open DevTools (F12) and check:
- No JavaScript errors
- Firebase initialization successful (if configured)
- Network requests completing

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain

1. Go to **Settings > Domains**
2. Click **"Add"**
3. Enter your custom domain (e.g., `subflix.com`)
4. Follow DNS configuration instructions

### 4.2 Configure DNS

Update your domain's DNS records to point to Vercel:

- **CNAME:** Point to `cname.vercel.com`
- **A Records:** Use Vercel's IP addresses (provided in Vercel dashboard)

## Step 5: Continuous Deployment

### 5.1 Automatic Deployments

Every push to your GitHub repository automatically triggers a new deployment:

1. Make changes locally
2. Commit and push: `git push origin main`
3. Vercel automatically builds and deploys
4. New URL available in ~1-2 minutes

### 5.2 Preview Deployments

Create a pull request to get a preview deployment:

1. Create a new branch: `git checkout -b feature/my-feature`
2. Make changes and push: `git push origin feature/my-feature`
3. Create a pull request on GitHub
4. Vercel creates a preview URL automatically
5. Test changes before merging to main

## Step 6: Firebase Integration

### 6.1 Set Up Firebase

Follow the instructions in `FIREBASE_SETUP.md` to:
- Create a Firebase project
- Enable Firestore, Storage, Authentication
- Configure security rules
- Get your Firebase credentials

### 6.2 Add Firebase Credentials to Vercel

In Vercel dashboard:

1. **Settings > Environment Variables**
2. Add all `VITE_FIREBASE_*` variables
3. Click **"Save"**
4. Trigger a new deployment (push to GitHub)

### 6.3 Test Firebase Integration

Once deployed with Firebase credentials:
- Upload a subtitle (stores in Firestore)
- Download subtitle (retrieves from Storage)
- Admin approval (updates Firestore)

## Step 7: Telegram Mini App Integration

### 7.1 Update Bot Settings

In Telegram BotFather, set the Mini App URL to your Vercel domain:

```
/setmenubutton
```

Select your bot and enter your Vercel URL (e.g., `https://subflix-app.vercel.app`)

### 7.2 Test in Telegram

1. Open your bot in Telegram
2. Click the web app button
3. Verify app loads and functions work

## Troubleshooting

### Issue: "Only server code is displayed"

**Cause:** Build output directory is incorrect

**Fix:**
1. Check `vercel.json` has `"outputDirectory": "dist/public"`
2. Verify `package.json` build script is `"vite build"`
3. Redeploy: Push to GitHub or click "Redeploy" in Vercel dashboard

### Issue: "Build fails"

**Check:**
1. Vercel build logs: Click deployment > "View logs"
2. Ensure all dependencies are in `package.json`
3. Check for TypeScript errors: `pnpm check`
4. Verify environment variables are set

### Issue: "Firebase not working"

**Check:**
1. Environment variables are set in Vercel dashboard
2. Variables start with `VITE_` prefix
3. Values are correct (copy from Firebase Console)
4. Firestore security rules allow public read access

### Issue: "404 on page refresh"

**Cause:** Vercel not configured for client-side routing

**Fix:**
- `vercel.json` should have rewrites configured (already included)
- If not working, add to `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Performance Optimization

### 1. Enable Caching

Vercel automatically caches static assets. To optimize:

1. Add cache headers to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Monitor Performance

In Vercel dashboard:
- **Analytics:** View page load times
- **Functions:** Monitor serverless function usage
- **Deployments:** Track build times

## Security Best Practices

### 1. Protect Environment Variables

- Never commit `.env.local` to Git
- Use `.gitignore` to exclude env files
- Set secrets in Vercel dashboard, not in code

### 2. Firestore Security Rules

Ensure your Firestore rules restrict access:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /approved_subtitles/{document=**} {
      allow read: if true;
    }
    match /pending_subtitles/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null;
    }
  }
}
```

### 3. CORS Configuration

If using external APIs, configure CORS in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## Deployment Checklist

- [ ] `vercel.json` configured correctly
- [ ] `.vercelignore` excludes unnecessary files
- [ ] `package.json` build script is `"vite build"`
- [ ] Project pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables added (if using Firebase)
- [ ] Build succeeds (check logs)
- [ ] React app displays (not server code)
- [ ] All features working
- [ ] Custom domain configured (optional)
- [ ] Telegram bot URL updated
- [ ] Tested in Telegram Mini App

## Next Steps

1. **Monitor deployments** - Check Vercel dashboard regularly
2. **Set up analytics** - Track user behavior and performance
3. **Configure alerts** - Get notified of deployment failures
4. **Optimize images** - Use Vercel's image optimization
5. **Add CI/CD checks** - Run tests before deployment

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Firebase Hosting vs Vercel](https://www.reddit.com/r/reactjs/comments/...)
