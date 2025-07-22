# Vercel Deployment Setup

This guide will help you deploy your Deadlock Match Analyzer to Vercel with Steam API integration.

## Prerequisites

1. A Steam Web API key from: https://steamcommunity.com/dev/apikey
2. A Vercel account: https://vercel.com

## Quick Setup

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
# In your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - What's your project's name? deadlock-match-analyzer
# - In which directory is your code located? ./
```

### 3. Add Steam API Key
After deployment:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `STEAM_API_KEY`
   - **Value**: Your Steam Web API key
   - **Environment**: Production (and Preview if you want)
5. Click **Save**

### 4. Redeploy
```bash
vercel --prod
```

## Local Development

To test locally with the serverless function:

```bash
# Install dependencies if you haven't
npm install

# Start local development server
vercel dev
```

This will run your app at `http://localhost:3000` with the API functions working.

## Testing the API

Once deployed, you can test your Steam API function:
```
https://your-app.vercel.app/api/steam-user?steamids=76561197960361544
```

## Features

✅ **No CORS Issues**: Serverless function handles Steam API calls  
✅ **Secure API Key**: Key stored safely in Vercel environment variables  
✅ **Caching**: 1-hour cache to reduce API calls  
✅ **Error Handling**: Graceful fallbacks when Steam API is unavailable  
✅ **Free Tier**: 100GB bandwidth/month on Vercel free plan  

## Troubleshooting

**Function not working?**
- Check that `STEAM_API_KEY` is set in Vercel environment variables
- Verify the API key is valid at Steam Web API
- Check function logs in Vercel dashboard

**Local development issues?**
- Make sure you have Node.js installed
- Run `vercel dev` instead of a regular development server
- Check that your API key is set locally (use `.env.local` file)

**CORS errors?**
- The serverless function should handle CORS automatically
- Check `vercel.json` configuration is present

## Environment Variables

For local development, create `.env.local`:
```
STEAM_API_KEY=your_steam_api_key_here
```

## Project Structure
```
your-app/
├── api/
│   └── steam-user.js     # Serverless function
├── js/
│   └── api.js           # Updated to use Vercel function
├── vercel.json          # Vercel configuration
└── index.html           # Your main app
```

## Next Steps

After deployment:
1. Test the Steam profile name fetching works
2. Monitor usage in Vercel dashboard
3. Consider adding more serverless functions if needed
4. Set up custom domain (optional)

Happy coding! 🚀