# 🚀 Deployment Guide: SMS Fraud Detection System

## Architecture Overview
```
[Vercel - Next.js + LLM Agents] ←→ [Render - Python ML Service]
```

## 📋 Prerequisites
- [Render account](https://render.com) (free tier available)
- [Vercel account](https://vercel.com) (free tier available) 
- Your Groq API key
- Git repository (GitHub/GitLab)

---

## 🐍 Step 1: Deploy ML Service to Render

### Option A: Deploy via Render Dashboard (Easiest)

1. **Push ml_service to Git**:
   ```bash
   cd ml_service
   git init
   git add .
   git commit -m "Initial ML service commit"
   git push origin main
   ```

2. **Create Render Service**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Configure:
     - **Name**: `sms-fraud-ml-service`
     - **Root Directory**: `ml_service`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

3. **Deploy**: Render will automatically build and deploy
4. **Get your URL**: Copy the service URL (e.g., `https://sms-fraud-ml-service.onrender.com`)

### Option B: Deploy with render.yaml (Advanced)

1. **Push render.yaml with your code**
2. **Import project** in Render dashboard
3. **Automatic deployment** based on render.yaml config

---

## ▲ Step 2: Deploy Next.js App to Vercel

### 1. **Prepare for Deployment**

Make sure you have these files in your project root:
- ✅ `vercel.json` (created)
- ✅ `.env.local` (for local development only)
- ✅ `package.json` with correct dependencies

### 2. **Deploy to Vercel**

**Method A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod
```

**Method B: Vercel Dashboard**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Import Git repository
- Automatic deployment

### 3. **Configure Environment Variables in Vercel**

In your Vercel project settings, add:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `GROQ_API_KEY` | Your Groq API key | `gsk_...` |
| `ML_SERVICE_URL` | Your Render service URL | `https://sms-fraud-ml-service.onrender.com` |

---

## 🔧 Step 3: Verify Deployment

### Test ML Service
```bash
curl https://your-render-service.onrender.com/health
```

### Test Full System
1. Visit your Vercel URL
2. Enter test SMS message
3. Verify you see both ML and LLM results

---

## 🚨 Important Notes

### Render Free Tier Limitations
- **Cold starts**: Service may take 30-60 seconds to wake up after inactivity
- **Automatic sleep**: Service sleeps after 15 minutes of inactivity
- **Solution**: Upgrade to paid tier for always-on service

### Vercel Limitations
- **Function timeout**: 30 seconds (configured in vercel.json)
- **Edge runtime**: Not used due to Groq integration requirements

---

## 🛠️ Local Development vs Production

### Local Development
```bash
# Terminal 1: ML Service
cd ml_service
python app.py

# Terminal 2: Next.js
npm run dev
```

### Production
- **ML Service**: `https://your-service.onrender.com`
- **Next.js App**: `https://your-app.vercel.app`

---

## 🔍 Troubleshooting

### ML Service Issues
1. Check Render logs in dashboard
2. Verify model file is included in deployment
3. Check health endpoint: `/health`

### Next.js Issues  
1. Check Vercel function logs
2. Verify environment variables are set
3. Test ML service URL manually

### Connection Issues
1. Ensure ML_SERVICE_URL uses HTTPS (not HTTP)
2. Check CORS if needed
3. Verify network connectivity

---

## 📊 Monitoring & Performance

### Render Monitoring
- Dashboard metrics for response time, memory usage
- Custom health checks via `/health` endpoint

### Vercel Analytics  
- Built-in performance monitoring
- Function execution logs

---

## 💰 Cost Estimation

### Free Tier Usage
- **Render**: 750 hours/month (sufficient for demos)
- **Vercel**: 100GB bandwidth + 100 function executions/hour

### Upgrade Triggers
- **High traffic**: Upgrade Vercel for more bandwidth
- **Always-on ML**: Upgrade Render to prevent cold starts

---

## 🚀 Quick Deploy Commands

```bash
# 1. Deploy ML Service (push to git first)
# → Configure in Render dashboard

# 2. Deploy Next.js App  
npx vercel --prod

# 3. Set environment variables in Vercel dashboard
# GROQ_API_KEY=your_key
# ML_SERVICE_URL=https://your-service.onrender.com

# 4. Test deployment
curl https://your-app.vercel.app/api/analyze
```

**🎉 Your hybrid SMS fraud detection system is now live!**