# Telegram Mini App Integration Guide

This guide explains how to set up Subflix as a Telegram Mini App so users can access it directly from Telegram.

## Prerequisites

- A Telegram account
- Firebase hosting URL (after deploying Subflix)
- Basic understanding of Telegram bots

## Step 1: Create a Telegram Bot

### 1.1 Open BotFather

Search for **@BotFather** in Telegram and start a chat.

### 1.2 Create New Bot

Send the command:
```
/newbot
```

BotFather will ask for:
- **Bot name:** e.g., "Subflix Bot"
- **Bot username:** e.g., "subflix_bot" (must be unique and end with "bot")

### 1.3 Save Your Bot Token

BotFather will provide a token like:
```
123456789:ABCdefGHIjklmnoPQRstuvWXYZ_1234567890
```

Save this token securely—you'll need it for configuration.

## Step 2: Configure Mini App

### 2.1 Set Menu Button

Send this command to BotFather:
```
/setmenubutton
```

Select your bot, then choose:
- **Button type:** "Web App"
- **Button text:** "Open Subflix"
- **Web App URL:** Your Firebase hosting URL (e.g., `https://subflix-xxxxx.web.app`)

### 2.2 Set Default Admin

Send to BotFather:
```
/setdefaultadministratorrights
```

This allows the bot to manage the Mini App.

## Step 3: Update Subflix for Telegram

### 3.1 Add Telegram Web App Script

The script is already included in `client/index.html`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 3.2 Initialize Telegram in React

The app automatically initializes Telegram Web App. Update `client/src/pages/Home.tsx` to use real Telegram data:

```typescript
useEffect(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    
    const user = tg.initDataUnsafe?.user;
    if (user) {
      setUserInfo({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
      });
      
      // Check if user is admin
      const adminIds = [YOUR_TELEGRAM_ID]; // Replace with your ID
      setIsAdmin(adminIds.includes(user.id));
    }
  }
}, []);
```

### 3.3 Get Your Telegram User ID

To find your Telegram user ID:

1. Open Telegram and search for **@userinfobot**
2. Send `/start`
3. The bot will show your user ID

### 3.4 Update Admin IDs

Edit `client/src/pages/AdminDashboard.tsx`:

```typescript
const ADMIN_IDS = [YOUR_TELEGRAM_ID, OTHER_ADMIN_ID];
```

Replace with actual Telegram user IDs.

## Step 4: Deploy to Firebase

### 4.1 Build and Deploy

```bash
npm run build
firebase deploy
```

### 4.2 Verify Deployment

Visit your Firebase hosting URL in a browser to ensure the app loads correctly.

## Step 5: Test in Telegram

### 5.1 Open Your Bot

Search for your bot in Telegram (e.g., @subflix_bot) and open it.

### 5.2 Click Menu Button

You should see a button at the bottom that says "Open Subflix" or similar.

### 5.3 Test Features

- Browse subtitles
- Upload a subtitle
- Check admin dashboard (if you're an admin)
- Test search functionality

## Step 6: Customize Bot Behavior

### 6.1 Set Bot Commands

Send to BotFather:
```
/setcommands
```

Add useful commands:
```
start - Start using Subflix
help - Get help
dashboard - View my submissions
admin - Admin panel (admins only)
```

### 6.2 Set Bot Description

Send to BotFather:
```
/setdescription
```

Enter:
```
Subflix! - High-quality Sinhala subtitles for foreign films and TV series.
```

### 6.3 Set Bot Short Description

Send to BotFather:
```
/setshortdescription
```

Enter:
```
Sinhala subtitles for movies and TV shows
```

## Step 7: Advanced Configuration

### 7.1 Add Bot to Group

Users can add your bot to groups. To enable:

Send to BotFather:
```
/setjoingroups
```

Choose whether to allow adding to groups.

### 7.2 Set Inline Query

For advanced features, enable inline queries:

Send to BotFather:
```
/setinline
```

This allows users to search subtitles directly in chat.

### 7.3 Add Payments (Optional)

To enable payments through Telegram:

Send to BotFather:
```
/setpayment
```

Configure your payment provider (Stripe, etc.).

## Step 8: Monitor Usage

### Monitor Bot Activity

Send to BotFather:
```
/mybots
```

Select your bot, then "Statistics" to see:
- Number of users
- Messages sent/received
- Errors and issues

### Check Logs

Firebase Console > Hosting > Analytics shows:
- Page views
- User sessions
- Traffic sources

## Troubleshooting

**Issue: "Mini App not opening"**
- Verify Firebase URL is correct in BotFather settings
- Check browser console for errors
- Ensure Telegram Web App script is loaded

**Issue: "User ID not recognized"**
- Verify you're using correct Telegram user ID
- Get ID from @userinfobot
- Update ADMIN_IDS in code

**Issue: "Uploads not working in Telegram"**
- Check browser console for errors
- Verify Firebase Storage rules allow uploads
- Ensure file size is under limit

**Issue: "Bot not responding"**
- Verify bot token is correct
- Check Firebase deployment status
- Restart bot: send `/stop` to BotFather, then recreate

## Security Considerations

### Verify Telegram Data

In production, verify that data comes from Telegram:

```typescript
import crypto from 'crypto';

function verifyTelegramData(initData: string, botToken: string): boolean {
  const data = new URLSearchParams(initData);
  const hash = data.get('hash');
  data.delete('hash');

  const dataCheckString = Array.from(data.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return computedHash === hash;
}
```

### Protect Admin Functions

Always verify user ID before allowing admin actions:

```typescript
const isAdmin = ADMIN_IDS.includes(userInfo?.id);
if (!isAdmin) {
  toast.error("Unauthorized");
  return;
}
```

## Publishing Checklist

- [ ] Bot created via BotFather
- [ ] Menu button configured with Firebase URL
- [ ] Admin IDs updated in code
- [ ] App deployed to Firebase
- [ ] Tested in Telegram (desktop and mobile)
- [ ] All features working (upload, approve, download)
- [ ] Error handling in place
- [ ] Telegram Web App script loaded
- [ ] User data properly initialized
- [ ] Admin dashboard accessible only to admins

## Next Steps

1. Test thoroughly in Telegram
2. Gather feedback from users
3. Monitor Firebase usage
4. Optimize based on user behavior
5. Consider adding more features (ratings, comments, etc.)

## References

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots/botfather)
- [Telegram Web App Documentation](https://core.telegram.org/bots/webapps)
