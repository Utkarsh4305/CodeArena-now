# CodeArena Railway Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Deploy Backend to Railway
1. Go to [railway.app](https://railway.app) and create account
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your CodeArena repository
4. Railway will automatically detect `Dockerfile` and build with:
   - Python 3.10
   - GCC/G++ for C/C++
   - OpenJDK for Java
   - Node.js for JavaScript
   - All your existing Python libraries

### 2. Get Railway URL
- After deployment, Railway will provide a URL like: `https://codearena-production-xxxx.up.railway.app`
- Test it: `https://your-url.railway.app/health`

### 3. Update Frontend Environment
Replace `YOUR_RAILWAY_URL_HERE` in these files with your actual Railway URL:
- `client/.env.production`
- `client/.env.railway`

Example:
```env
REACT_APP_API_URL=https://codearena-production-xxxx.up.railway.app
REACT_APP_EVAL_API_URL=https://codearena-production-xxxx.up.railway.app
```

### 4. Redeploy Frontend to Vercel
```bash
vercel --prod
```

## 🔧 Architecture After Migration

```
Frontend (Vercel)          Backend (Railway)
┌─────────────────┐       ┌──────────────────┐
│ React App       │ ────► │ Flask + Compilers│
│ Static Files    │       │ Python/Node/Java │
│ Fast Global CDN │       │ GCC/G++          │
└─────────────────┘       └──────────────────┘
```

## ✅ What This Achieves

- **Frontend**: Fast Vercel CDN for React app
- **Backend**: Full Railway environment with native compilers
- **Zero Code Changes**: Your compilation logic works exactly as-is
- **Better Performance**: Native compiler execution (faster than APIs)
- **No Rate Limits**: Full control over execution environment

## 🧪 Testing Endpoints

After deployment, test these:
- `/health` - Health check
- `/test` - Test all language compilers
- `/compile` - Main compilation endpoint
- `/formatters_status` - Check formatter availability

## 🔄 Local Development

Keep using:
```bash
# Backend
cd backend && python compile.py

# Frontend  
cd client && npm start
```

Your original development workflow remains unchanged!