# 📦 Warehouse Scanner App

Fast, mobile-first PWA for warehouse parcel scanning operations.

## ✨ Features

- ✅ **Scan READY** - Mark parcels ready for courier pickup
- ✅ **Scan PICKED UP** - Confirm handover to courier
- ✅ **Real-time Counts** - See today's totals and batch counts
- ✅ **Audit Trail** - Complete scan history with timestamps
- ✅ **Sound Feedback** - Beep + vibration on successful scan
- ✅ **Offline Capable** - Works as PWA on mobile devices
- ✅ **Fast** - <200ms scan validation

## 🚀 Quick Deploy to Vercel (Browser Only - No Terminal!)

### Step 1: Upload to GitHub

1. Go to https://github.com/new
2. Create repository named `warehouse-scan-app`
3. Download this folder as ZIP
4. On GitHub, click "uploading an existing file"
5. Drag all files from the ZIP into GitHub
6. Click "Commit changes"

### Step 2: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `warehouse-scan-app`
4. **Add Environment Variables**:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
5. Click "Deploy"
6. Wait 2-3 minutes
7. ✅ Done! Your app is live!

## 📱 Install on Mobile

1. Open your Vercel URL on mobile (Chrome/Safari)
2. Tap browser menu (⋮ or Share button)
3. Select "Add to Home Screen"
4. App opens full-screen like a native app!

## 🔧 Environment Variables

Get these from Supabase Dashboard → Settings → API:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 📊 Database Setup Required

**IMPORTANT**: Before using the app, run the SQL migration:

1. Go to Supabase Dashboard → SQL Editor
2. Copy-paste contents of `migration_fix_critical_gaps.sql`
3. Click "Run"
4. Verify with: `SELECT * FROM get_warehouse_counts();`

## 🎯 Usage

### For Warehouse Operators:

1. Open app on mobile
2. Enter your name
3. Click "Start Scanning"
4. Point camera at barcode
5. Hear beep + see green checkmark on success
6. View your batch count in real-time

### Workflow:

1. **READY Screen** → Scan parcels when packed and ready
2. **PICKED UP Screen** → Scan when handing to courier
3. System validates: Can't pickup unless marked READY first!

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Barcode**: html5-qrcode
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Hosting**: Vercel
- **PWA**: Manifest.json for mobile install

## 📂 Project Structure

```
warehouse-scan-app/
├── public/
│   └── manifest.json       # PWA configuration
├── src/
│   ├── components/
│   │   └── BarcodeScanner.jsx
│   ├── lib/
│   │   └── supabase.js     # Supabase client
│   ├── pages/
│   │   ├── ScanReady.jsx
│   │   └── ScanPickedUp.jsx
│   ├── App.jsx             # Routes
│   ├── main.jsx            # Entry point
│   └── index.css           # Tailwind styles
├── index.html
├── package.json
└── README.md
```

## 🔐 Security

- Uses Supabase Row Level Security (RLS)
- API keys are public anon keys (safe for frontend)
- All validation happens server-side
- Complete audit trail in database

## 🐛 Troubleshooting

### "Camera not working"
- Check browser permissions (Chrome → Settings → Camera)
- Must use HTTPS (Vercel provides this automatically)
- Try refreshing the page

### "Network error on scan"
- Check internet connection
- Verify Supabase Edge Functions are deployed
- Check browser console for errors

### "Build failed on Vercel"
- Verify environment variables are set correctly
- Check Vercel build logs for specific error

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard → Logs
2. Check Vercel Dashboard → Deployment Logs
3. Verify environment variables match Supabase settings

## 📄 License

MIT License - Free to use and modify

---

**Made with ❤️ for WeShuddhs Warehouse Team**
