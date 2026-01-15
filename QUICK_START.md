# Kunajoto - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

### Step 2: Add API Key to Environment

Open `.env` file and add your key:

```bash
VITE_GEMINI_API_KEY=your_key_here
```

### Step 3: Start the App

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and you're ready to go!

---

## ✅ What's Working Now

- **User Registration & Login** - Create accounts and sign in
- **143 Real Venues** - Loaded from Supabase database
- **Favorites System** - Save your favorite venues
- **User Preferences** - Customize your experience
- **CityGauge AI** - Chat with AI for recommendations (needs API key)
- **Geolocation** - Find venues near you
- **Vibe Scores** - See real-time venue popularity

---

## 🔧 Troubleshooting

### "Database error saving new user"
- **Fixed!** This was the main issue and is now resolved
- Users can now register successfully

### CityGauge AI not responding
- Add `VITE_GEMINI_API_KEY` to `.env` file
- Restart dev server after adding key

### Duplicate text in forms
- **Fixed!** UI has been cleaned up

### Favorites not working
- **Fixed!** Database integration is now working

---

## 📦 Deployment to Netlify

1. Go to Netlify dashboard
2. Add these environment variables:
   - `VITE_SUPABASE_URL` = `https://grnekxrkypgighmxyveh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (from `.env` file)
   - `VITE_GEMINI_API_KEY` = (your Gemini API key)
3. Deploy!

---

## 📚 More Information

- **Full Setup Guide**: See `BACKEND_SETUP_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_REPORT.md`
- **Database Schema**: See `SUPABASE_SETUP.sql`

---

## 🆘 Need Help?

1. Check `BACKEND_SETUP_GUIDE.md` for detailed instructions
2. Run tests: `npx tsx test-endpoints.ts`
3. Check Supabase logs in dashboard

---

## 🎉 You're All Set!

The app is fully functional and ready to use. All backend integration issues have been resolved. Enjoy building with Kunajoto!
