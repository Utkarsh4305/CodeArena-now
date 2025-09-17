# CodeArena Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- Git repository
- Node.js and Python locally for testing

## Deployment Steps

### 1. Vercel Deployment (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy "CodeArena"? → Yes
   - Which scope? → Select your account
   - Link to existing project? → No (for first deployment)
   - What's your project's name? → codearena
   - In which directory is your code located? → ./

5. **The deployment will automatically**:
   - Build the React client
   - Set up the Python Flask backend as serverless functions
   - Configure routing for both frontend and API

### 2. Environment Variables (Auto-configured)

The following environment variables are automatically set:
- `REACT_APP_API_URL=/api` 
- `REACT_APP_EVAL_API_URL=/api`
- `REACT_APP_ENVIRONMENT=production`

### 3. API Endpoints

Once deployed, your API will be available at:
- `https://your-app.vercel.app/api/compile` - Code compilation
- `https://your-app.vercel.app/api/indent_line` - Line indentation
- `https://your-app.vercel.app/api/indentation_test` - Code formatting
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/test` - Language testing

### 4. Supported Features in Production

✅ **Working Features**:
- Python code compilation and execution
- JavaScript (Node.js) compilation and execution  
- Java compilation and execution
- C/C++ compilation and execution
- Code formatting and indentation
- Firebase authentication
- Workspace management
- Assignment creation and submission

⚠️ **Limitations on Vercel**:
- Execution timeout: 10 seconds for hobby plan
- Memory limit: 1024MB for hobby plan
- Lambda size: 50MB (configured)

### 5. Alternative Deployment Options

#### Railway Deployment
If you prefer Railway, the `nixpacks.toml` is already configured:

1. Connect your GitHub repo to Railway
2. Railway will automatically detect the nixpacks.toml
3. Set environment variables in Railway dashboard

#### Firebase Hosting (Frontend only)
For frontend-only deployment:

1. Build the client: `cd client && npm run build`
2. Deploy: `firebase deploy`

## Testing the Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/api/health`
2. **Test Languages**: Visit `https://your-app.vercel.app/api/test`
3. **Frontend**: Visit `https://your-app.vercel.app`

## Troubleshooting

### Common Issues:

1. **Build Fails**: 
   - Check that all dependencies are in package.json
   - Verify Python requirements.txt is complete

2. **API Not Working**:
   - Check Vercel function logs in dashboard
   - Verify CORS configuration

3. **Environment Variables**:
   - These are set automatically by vercel.json
   - Override in Vercel dashboard if needed

### Logs and Monitoring:
- View logs in Vercel dashboard
- Use `vercel logs <deployment-url>` for CLI access

## Production Considerations

1. **Security**: 
   - Firebase rules are already configured
   - CORS is set to allow your domain

2. **Performance**:
   - Code execution is limited by Vercel's serverless constraints
   - Consider upgrading Vercel plan for higher limits

3. **Monitoring**:
   - Set up Vercel Analytics (optional)
   - Monitor function execution times

## Support

- For Vercel issues: Check Vercel documentation
- For app issues: Review the application logs