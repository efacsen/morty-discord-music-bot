# YouTube Authentication Guide

## Why You Need YouTube Cookies

YouTube frequently blocks bot requests to prevent automated downloads. Using your YouTube account cookies helps:

1. **Reduces blocking**: Authenticated requests are less likely to be blocked
2. **Access to premium features**: If you have YouTube Premium, you get ad-free streams
3. **Higher quality streams**: Access to better quality audio
4. **Better reliability**: More stable playback

## Current Issue Without Cookies

Without authentication, you'll see errors like:
- `Error: No valid URL to decipher`
- `Failed to extract stream for Track`
- Tracks immediately finishing without playing

## How to Set Up YouTube Authentication

### Step 1: Install Cookie Exporter Extension

#### For Chrome/Brave/Edge:
1. Go to the Chrome Web Store
2. Search for "Get cookies.txt LOCALLY" or visit:
   https://chromewebstore.google.com/detail/cclelndahbckbenkjhflpdbgdldlbecc
3. Click "Add to Chrome"

#### For Firefox:
1. Go to Firefox Add-ons
2. Search for "Get cookies.txt LOCALLY" or visit:
   https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt-locally/
3. Click "Add to Firefox"

### Step 2: Export Your YouTube Cookies

1. **Open YouTube**: Navigate to https://www.youtube.com
2. **Log in**: Make sure you're logged into your YouTube/Google account
3. **Open the extension**: Click the "Get cookies.txt LOCALLY" icon in your browser toolbar
4. **Export cookies**:
   - The extension should automatically detect you're on youtube.com
   - Click "Export" or "Export As" button
   - Choose "Netscape" format (default)
5. **Save the file**:
   - Save it as `cookies.txt`
   - If running with Node directly, place it next to your `.env`
   - If running with Docker, place it in the repo's `cookies/` directory as `cookies/cookies.txt`

### Step 3: Verify the Setup

Use the env variable that matches how you run the bot.

**Node / local setup**

```dotenv
YTDLP_COOKIES_FILE=./cookies.txt
```

**Docker / docker compose setup**

```dotenv
YTDLP_COOKIES_FILE=/cookies/cookies.txt
```

Optional alternative for local setups:

```dotenv
YTDLP_COOKIES_BROWSER=chrome
```

Then restart the bot.

- Local Node: `npm start`
- Docker: `docker compose restart bot`

## Security Warnings

### ⚠️ Important Security Notes:

1. **Never share your cookies file**: It contains your login session
2. **Add to .gitignore**: The cookies file is already ignored by git
3. **Cookies expire**: You may need to re-export cookies every few weeks/months
4. **Account security**:
   - Don't share your bot publicly with your personal YouTube cookies
   - Consider using a separate YouTube account for the bot
   - Enable 2FA on your YouTube account

### If You Don't Have YouTube Premium

The bot will still work without premium, but:
- You may encounter more rate limiting
- Stream quality might be lower
- More frequent cookie refreshes may be needed

## Troubleshooting

### "No YouTube cookies found" message
- Check that your exported `cookies.txt` file exists where you expect it
- Verify the path in `.env` is correct (`./cookies.txt` for local Node or `/cookies/cookies.txt` for Docker)
- Make sure the file isn't accidentally named `cookies.txt.txt` (Windows may hide extensions)

### Still getting "No valid URL to decipher"
1. Try re-exporting fresh cookies
2. Make sure you're logged into YouTube when exporting
3. Check that the cookie file isn't empty
4. Try using a different browser to export cookies

### Cookies stopped working
- YouTube rotates cookies periodically
- Export fresh cookies (recommended every 1-2 weeks)
- If issues persist, try logging out and back into YouTube before exporting

## Alternative: Using Without Authentication

The bot can work without cookies, but with limitations:
- Less reliable playback
- More frequent errors
- May be blocked by YouTube after several requests

The `player_id: '0004de42'` configuration helps even without cookies, but authentication is strongly recommended for production use.

## Privacy Considerations

When you export cookies:
- All your YouTube session data is in that file
- Anyone with this file can access your YouTube account
- The extension "Get cookies.txt LOCALLY" is open-source and safe
- Your cookies never leave your computer with this extension
- However, once exported, you're responsible for securing the file

## For Multi-Host Setup

If multiple people are hosting the bot:
1. **Option A**: Each person exports their own cookies
   - Each host maintains their own exported `cookies.txt`
   - Not committed to git repository

2. **Option B**: Use a shared YouTube account
   - Create a dedicated YouTube account for the bot
   - All hosts use the same exported cookie file
   - Share securely (encrypted messaging, not email)
   - Update when cookies expire

## Need Help?

If you're still experiencing issues after following this guide:
1. Check the console output for specific error messages
2. Verify the cookie file is properly formatted (should be plain text)
3. Try deleting and re-exporting cookies
4. Check if YouTube is accessible from your network
