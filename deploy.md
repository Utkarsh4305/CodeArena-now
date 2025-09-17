# Deploy CodeArena Backend

## Option 1: Render (Recommended - Free Tier)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Docker deployment config"
   git push origin main
   ```

2. **Deploy to Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login
   - "New Web Service"
   - Connect GitHub repository
   - Select "Docker" as environment
   - Render will auto-detect our `Dockerfile`
   - Deploy (takes ~5-10 minutes)

3. **Get URL**: Render provides URL like: `https://codearena-backend.onrender.com`

## Option 2: Railway (Requires Payment)

1. **Add payment method** to Railway dashboard
2. **Deploy**:
   ```bash
   railway up
   ```

## After Deployment

1. **Test Backend**: Visit `https://your-url/health`
2. **Update Frontend**: Replace URL in `client/.env.production`
3. **Redeploy Frontend**: `vercel --prod`

Your compilation system will work exactly as-is with all compilers!