# Subflix! Quick Start Guide

Get Subflix running locally in minutes for testing and development.

## Local Development (IndexedDB)

### 1. Install Dependencies

```bash
cd subflix-app
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 3. Test Features

**Browse Subtitles:**
- Home page shows all approved subtitles (empty initially)

**Upload Subtitle:**
- Click "Upload" button in header
- Enter movie title: "The Matrix"
- Upload a test `.srt` file (or create one with sample content)
- Optional: Add donation link
- Click "Upload"

**Admin Dashboard:**
- Click "Admin" button (only visible if you're admin)
- Review pending subtitles
- Click "Approve" or "Reject"

**Creator Dashboard:**
- Click "Dashboard" button
- View your pending and approved subtitles

**Search:**
- Use search bar to filter by title or uploader

### 4. Test Data

Create a sample `.srt` file for testing:

```
1
00:00:00,000 --> 00:00:05,000
Hello, this is a test subtitle.

2
00:00:05,000 --> 00:00:10,000
This is the second line.
```

Save as `test.srt` and upload through the app.

## Local Storage (IndexedDB)

All data is stored locally in your browser's IndexedDB:

- **Database Name:** `SubflixDB`
- **Object Stores:**
  - `pending_subtitles` - Awaiting admin approval
  - `approved_subtitles` - Published subtitles

### Clear Local Data

Open browser DevTools and run:

```javascript
// Clear all Subflix data
const request = indexedDB.deleteDatabase('SubflixDB');
request.onsuccess = () => console.log('Database cleared');
```

Or in DevTools > Application > IndexedDB > SubflixDB > Delete

## Mock Telegram User

The app uses a mock Telegram user for local testing:

```javascript
{
  id: 12345,
  username: "testuser",
  first_name: "Test"
}
```

This ID is configured as an admin, so you can access the admin dashboard.

## Production Deployment

When ready to deploy to Firebase:

1. Follow instructions in `FIREBASE_SETUP.md`
2. Configure environment variables
3. Build: `pnpm build`
4. Deploy: `firebase deploy`

## Development Tips

### Hot Module Replacement (HMR)

Changes to React components automatically reload in the browser.

### TypeScript Checking

```bash
pnpm check
```

### Format Code

```bash
pnpm format
```

### Build for Production

```bash
pnpm build
```

Output goes to `dist/` directory.

## Troubleshooting

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**IndexedDB not working:**
- Check browser console for errors
- Ensure IndexedDB is enabled in browser settings
- Try incognito/private mode

**Upload fails:**
- Check file size (should be < 10 MB)
- Ensure file is valid `.srt` format
- Check browser console for errors

**Admin dashboard not visible:**
- Verify you're using the mock user ID (12345)
- Clear browser cache and reload

## Next Steps

1. Test all features locally
2. Create sample subtitle files
3. Configure Firebase project
4. Set up Telegram bot
5. Deploy to Firebase Hosting
6. Test in Telegram Mini App

For detailed setup instructions, see `README.md` and `FIREBASE_SETUP.md`.
