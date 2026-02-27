# Subflix! - Sinhala Subtitles Distribution Platform

A Netflix-inspired Telegram Mini App for distributing high-quality Sinhala subtitles for foreign films and TV series. Built with React, IndexedDB for local testing, and Firebase for production deployment.

## Features

**User Features:**
- Browse and search approved subtitles by movie/TV title
- Download subtitles as `.srt` files
- Support creators through donation links
- Mobile-friendly dark theme with Netflix-inspired design

**Creator Features:**
- Upload `.srt` files with title and donation link
- View pending and approved submissions
- Track subtitle status in personal dashboard

**Admin Features:**
- Review pending subtitle submissions
- Approve or reject uploads for quality control
- Manage admin access through hardcoded Telegram IDs

**Technical Features:**
- Fully responsive mobile design (Telegram Mini App compatible)
- IndexedDB for local development and testing
- Firebase integration for production (Firestore, Storage, Hosting)
- Telegram Web App API integration for user authentication
- Dark theme with red accents (Cinematic Dark Elegance design)

## Architecture

### Design Philosophy: Cinematic Dark Elegance

The interface follows Netflix's proven UX principles with a dark background (#0F0F0F), signature red accents (#E50914), and smooth animations. The design prioritizes content visibility while maintaining premium aesthetics.

**Key Design Elements:**
- Deep charcoal backgrounds for immersive viewing
- Red accent borders on card hover states
- Gradient overlays on poster images for text readability
- Smooth card lift animations (2-3px elevation on hover)
- Poppins Bold for headers (modern energy), Inter Regular for body (readability)

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components for consistency
- Wouter for client-side routing
- Framer Motion for animations

**Local Storage:**
- IndexedDB with two object stores: `pending_subtitles` and `approved_subtitles`
- Stores subtitle metadata and `.srt` file content as text blobs

**Production Backend:**
- Firebase Firestore for database
- Firebase Storage for `.srt` file hosting
- Firebase Hosting for app deployment
- Firebase Authentication (anonymous + Telegram user data)

## Quick Start

### Local Development

**1. Install Dependencies**

```bash
npm install
```

**2. Start Development Server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

**3. Test Locally**

- Browse the home page (no subtitles initially)
- Click "Upload" to add a test subtitle
- Use mock admin ID `12345` to access admin dashboard
- Test search, download, and creator dashboard features

### Production Deployment

**1. Set Up Firebase Project**

Follow the detailed instructions in `FIREBASE_SETUP.md`:
- Create Firebase project
- Enable Firestore, Storage, Authentication, Hosting
- Configure security rules
- Set admin IDs

**2. Configure Environment Variables**

Create `.env.local` with your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**3. Build and Deploy**

```bash
npm run build
firebase deploy
```

**4. Integrate with Telegram**

- Create a bot via @BotFather
- Set the Mini App URL to your Firebase hosting domain
- Add your Telegram user ID to admin configuration

## Project Structure

```
subflix-app/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Main browse/upload page
│   │   │   ├── AdminDashboard.tsx    # Admin review panel
│   │   │   ├── CreatorDashboard.tsx  # Creator submissions view
│   │   │   └── NotFound.tsx          # 404 page
│   │   ├── components/               # Reusable UI components
│   │   ├── lib/
│   │   │   └── firebase.ts           # Firebase service module
│   │   ├── contexts/                 # React contexts
│   │   ├── App.tsx                   # Main app component
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Global styles (Cinematic Dark Elegance)
│   ├── public/                       # Static assets
│   └── index.html                    # HTML template
├── FIREBASE_SETUP.md                 # Detailed Firebase setup guide
├── firebase-config.template.json     # Firebase config template
└── README.md                         # This file
```

## Data Model

### Firestore Collections

**approved_subtitles**
```typescript
{
  id: string;           // Auto-generated document ID
  title: string;        // Movie/series title
  uploader: string;     // Creator username
  userId: string;       // Telegram user ID
  content: string;      // .srt file content
  donationLink: string; // Creator's donation URL
  posterUrl: string;    // Movie poster image URL
  status: "approved";
  uploadedAt: Date;
  fileUrl: string;      // Firebase Storage download URL
}
```

**pending_subtitles**
```typescript
{
  id: string;
  title: string;
  uploader: string;
  userId: string;
  content: string;
  donationLink: string;
  posterUrl: string;
  status: "pending";
  uploadedAt: Date;
  fileUrl: string;
}
```

## API Integration

### Telegram Web App

The app integrates with Telegram's Web App API for user authentication:

```typescript
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user;
// Returns: { id, username, first_name, ... }
```

### Firebase Services

See `client/src/lib/firebase.ts` for complete Firebase integration:
- `getApprovedSubtitles()` - Fetch all approved subtitles
- `getPendingSubtitles()` - Fetch pending submissions
- `getUserSubtitles(userId)` - Get user's own submissions
- `uploadSubtitle(subtitle, file)` - Upload new subtitle
- `approveSubtitle(id)` - Admin approval
- `rejectSubtitle(id)` - Admin rejection

## Security

### Firestore Security Rules

- **Public Read:** Anyone can read approved subtitles
- **User Write:** Users can upload new subtitles (stored as pending)
- **Admin Only:** Only hardcoded admin IDs can approve/reject
- **User Privacy:** Users can only read their own pending submissions

### Authentication

- Telegram user ID is the primary identifier
- Anonymous Firebase auth for database access
- Admin access verified against hardcoded ID list

## Customization

### Change Admin IDs

Edit `ADMIN_IDS` array in `client/src/pages/AdminDashboard.tsx`:

```typescript
const ADMIN_IDS = [12345, 67890]; // Add your Telegram user IDs
```

### Update Theme Colors

Edit CSS variables in `client/src/index.css`:

```css
--primary: #E50914;        /* Netflix red */
--background: #0F0F0F;     /* Dark background */
--card: #1A1A1A;           /* Card background */
```

### Add Poster Image API

Replace placeholder images by integrating OMDB API:

```typescript
const posterUrl = `https://www.omdbapi.com/?t=${title}&apikey=${OMDB_KEY}&type=movie`;
```

## Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Firestore security rules deployed
- [ ] Admin IDs set in Firestore
- [ ] Environment variables configured
- [ ] App built successfully (`npm run build`)
- [ ] Firebase hosting deployed (`firebase deploy`)
- [ ] Telegram bot created via BotFather
- [ ] Mini App URL configured in bot settings
- [ ] Tested in Telegram (upload, approve, download)
- [ ] Custom domain configured (optional)

## Troubleshooting

**Local Storage Not Working:**
- Check browser console for IndexedDB errors
- Clear IndexedDB: DevTools > Application > IndexedDB > Delete

**Firebase Connection Issues:**
- Verify `.env.local` has correct credentials
- Check Firebase Console for service status
- Ensure Firestore security rules allow anonymous access

**Telegram Mini App Not Loading:**
- Verify Firebase hosting URL is correct
- Check browser console for CORS errors
- Ensure Telegram Web App script is loaded

**Admin Dashboard Not Accessible:**
- Verify your Telegram user ID in `ADMIN_IDS`
- Check that you're logged in via Telegram
- Clear browser cache and reload

## Performance Optimization

**Firestore Queries:**
- Indexes created automatically for common queries
- Consider pagination for large subtitle collections
- Use composite indexes for complex filters

**Storage:**
- `.srt` files are typically small (< 1 MB)
- Consider compression for very large files
- Implement cleanup for rejected submissions

**Hosting:**
- Firebase CDN caches static assets globally
- React app is minified and optimized by Vite
- Consider adding service worker for offline support

## Legal Disclaimer

Subflix is a fan-made subtitle distribution platform. Users are responsible for ensuring their uploads comply with copyright laws and platform terms of service. The platform does not endorse copyright infringement and reserves the right to remove content upon request.

## Future Enhancements

- Sinhala language search and filtering
- Subtitle preview before download
- Rating system for subtitles
- User profiles and reputation
- Advanced search filters (release year, genre)
- Batch upload for series
- Subtitle quality metrics
- Community moderation system

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase documentation
3. Consult Telegram Mini App documentation
4. Open an issue on GitHub (if applicable)

## Credits

Built with React, Firebase, and Telegram Web App API. Designed with Cinematic Dark Elegance principles inspired by Netflix's UX.
