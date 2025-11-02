# 🚀 Deploying Real Estate Platform to Render

This guide will walk you through deploying your Real Estate Platform to Render with both frontend and backend services.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: Create a database at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
4. **Cloudinary Account**: Set up at [cloudinary.com](https://cloudinary.com)

## 🗄️ Step 1: Set Up MongoDB Atlas

### 1.1 Create Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Build a Database"
3. Choose "FREE" tier (M0 Sandbox)
4. Select your preferred region
5. Click "Create Cluster"

### 1.2 Configure Database Access
1. Go to **Database Access** → **Add New Database User**
2. Create a username and strong password
3. Set privileges to "Read and write to any database"
4. Click "Add User"

### 1.3 Configure Network Access
1. Go to **Network Access** → **Add IP Address**
2. Click "Allow Access from Anywhere" (or add `0.0.0.0/0`)
3. Click "Confirm"

### 1.4 Get Connection String
1. Go to **Database** → Click "Connect"
2. Choose "Connect your application"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your database user password
5. Add your database name before the `?` (e.g., `/realstate?retryWrites=true`)

## 📦 Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Ready for Render deployment"

# Create GitHub repository and add remote
git remote add origin https://github.com/yourusername/realstate-platform.git

# Push to GitHub
git push -u origin main
```

## 🌐 Step 3: Deploy Backend to Render

### 3.1 Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `realstate-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **"Free"** (or paid plan for better performance)

### 3.2 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | production |
| `PORT` | `10000` | 10000 |
| `MONGO_URI` | Your MongoDB Atlas connection string | mongodb+srv://user:pass@cluster.mongodb.net/realstate |
| `JWT_SECRET` | Strong random string (min 32 characters) | your_super_secret_jwt_key_32_chars_minimum |
| `JWT_EXPIRE` | `30d` | 30d |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | your_cloud_name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | 123456789012345 |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | abc123def456 |
| `CLIENT_URL` | Your frontend URL (will update later) | https://realstate-frontend.onrender.com |

**Generate JWT_SECRET:**
```bash
# Node.js method
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL method
openssl rand -hex 32

# Online generator
# Visit: https://www.uuidgenerator.net/
```

### 3.3 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your backend URL (e.g., `https://realstate-backend.onrender.com`)
4. Test it by visiting: `https://your-backend-url.onrender.com/health`

## 🎨 Step 4: Deploy Frontend to Render

### 4.1 Create Static Site
1. Go to Render Dashboard
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `realstate-frontend`
- **Branch**: `main`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### 4.2 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-backend-url.onrender.com` |

**Important**: Replace `your-backend-url` with your actual backend URL from Step 3.3

### 4.3 Configure Redirects/Rewrites

Render will automatically handle SPA routing, but verify in **Settings** → **Redirects/Rewrites**:

```
/* /index.html 200
```

### 4.4 Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://realstate-frontend.onrender.com`

## 🔄 Step 5: Update Backend Environment

### 5.1 Update CLIENT_URL
1. Go to your backend service in Render
2. Go to **"Environment"** tab
3. Update `CLIENT_URL` to your frontend URL: `https://realstate-frontend.onrender.com`
4. Click **"Save Changes"**
5. Service will automatically redeploy

## ✅ Step 6: Verify Deployment

### 6.1 Test Backend
```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Should return:
# {"status":"success","message":"API is healthy","timestamp":"...","environment":"production"}
```

### 6.2 Test Frontend
1. Visit your frontend URL
2. Try to register a new user
3. Try to login
4. Create a property listing
5. Test chat functionality
6. Test contract requests

### 6.3 Common Issues

**Issue: "Cannot connect to database"**
- ✅ Check MongoDB Atlas IP whitelist (should be `0.0.0.0/0`)
- ✅ Verify MONGO_URI is correct with password and database name
- ✅ Check MongoDB Atlas user has correct permissions

**Issue: "CORS Error"**
- ✅ Verify CLIENT_URL in backend matches frontend URL exactly (no trailing slash)
- ✅ Check browser console for exact error
- ✅ Ensure backend CORS configuration includes frontend URL

**Issue: "Images not uploading"**
- ✅ Verify Cloudinary credentials are correct
- ✅ Check Cloudinary dashboard for quota limits
- ✅ Test Cloudinary credentials locally first

**Issue: "Socket.IO not connecting"**
- ✅ Verify VITE_SOCKET_URL points to backend URL (not /api)
- ✅ Check backend CORS configuration includes frontend
- ✅ Ensure WebSocket connections are allowed (Render supports them)

**Issue: "Free tier services sleep after 15 minutes"**
- ✅ This is expected behavior for Render free tier
- ✅ First request after sleeping takes 30-60 seconds
- ✅ Consider upgrading to paid tier for production
- ✅ Use cron jobs or uptime monitors to keep service awake

## 🔧 Step 7: Seed Production Database (Optional)

### 7.1 Create Admin User
You have two options:

**Option A: Use Render Shell**
1. Go to your backend service
2. Click **"Shell"** tab
3. Run: `node seed.js`

**Option B: API Request**
```bash
# Register admin user via API
curl -X POST https://your-backend-url.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourdomain.com",
    "password": "your_secure_password",
    "role": "admin"
  }'
```

**Option C: MongoDB Atlas**
1. Go to MongoDB Atlas → Browse Collections
2. Find `users` collection
3. Find your user document
4. Edit document and change `"role": "user"` to `"role": "admin"`

## 🔒 Step 8: Security Checklist

- ✅ Strong JWT_SECRET (minimum 32 characters)
- ✅ Secure MongoDB password
- ✅ Cloudinary credentials kept private
- ✅ No .env files committed to Git
- ✅ CORS configured with specific origins
- ✅ Rate limiting enabled
- ✅ Helmet.js security headers active
- ✅ Input sanitization enabled
- ✅ HTTPS enforced (automatic on Render)

## 📊 Step 9: Monitor Your Application

### 9.1 Render Dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history
- Set up email notifications

### 9.2 Set Up Uptime Monitoring (Optional)
Use services like:
- [UptimeRobot](https://uptimerobot.com) - Free tier available
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

**Ping your backend health endpoint every 5-10 minutes to prevent sleeping:**
```
https://your-backend-url.onrender.com/api/health
```

## 🚀 Step 10: Custom Domain (Optional)

### 10.1 Add Custom Domain
1. Go to your Render service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain (e.g., `api.yourdomain.com` for backend)
4. Add DNS records as shown by Render
5. Wait for DNS propagation (can take up to 48 hours)

### 10.2 Update Environment Variables
After adding custom domain, update:
- Backend `CLIENT_URL` → your custom frontend domain
- Frontend `VITE_API_URL` → your custom backend domain

## 🔄 Step 11: Automatic Deployments

Render automatically deploys when you push to your connected branch:

```bash
# Make changes locally
git add .
git commit -m "Update: Added new feature"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Pull latest code
# 3. Run build commands
# 4. Deploy new version
```

**Manual Deploy:**
- Go to service → Click **"Manual Deploy"** → **"Deploy latest commit"**

## 📝 Step 12: Environment-Specific Configs

### Development
```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/realstate
CLIENT_URL=http://localhost:5173
```

### Production (Render)
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/realstate
CLIENT_URL=https://realstate-frontend.onrender.com
```

## 🎯 Performance Tips

1. **Enable Compression**: Backend already configured with compression
2. **Optimize Images**: Use Cloudinary transformations
3. **Enable Caching**: Add cache headers for static assets
4. **Use CDN**: Cloudinary serves images via CDN
5. **Database Indexes**: Ensure MongoDB indexes are set (done via models)
6. **Upgrade Tier**: Consider paid plans for better performance

## 💰 Cost Breakdown

### Free Tier (Development/Testing)
- **Render Backend**: Free (750 hours/month, sleeps after 15 min)
- **Render Frontend**: Free (100 GB bandwidth/month)
- **MongoDB Atlas**: Free (512 MB storage, M0 tier)
- **Cloudinary**: Free (25 GB storage, 25 GB bandwidth)
- **Total**: $0/month

### Paid Tier (Production)
- **Render Backend**: $7/month (Starter plan, always on)
- **Render Frontend**: Free or $1.50/month (Pro CDN)
- **MongoDB Atlas**: $9/month (M2 shared, 2GB storage)
- **Cloudinary**: $89/month or pay-as-you-go
- **Total**: ~$16-106/month

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Render Community**: https://community.render.com

## 🎉 Congratulations!

Your Real Estate Platform is now live! Share your URLs:
- **Frontend**: https://realstate-frontend.onrender.com
- **Backend API**: https://realstate-backend.onrender.com
- **Admin Dashboard**: https://realstate-frontend.onrender.com/admin

---

## 🔧 Troubleshooting Commands

```bash
# View backend logs
# Go to Render Dashboard → Service → Logs

# Check build logs
# Go to Render Dashboard → Service → Events

# Test API endpoints
curl https://your-backend-url.onrender.com/api/health
curl https://your-backend-url.onrender.com/api/properties

# Test MongoDB connection locally
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/realstate"

# Redeploy service
# Dashboard → Service → Manual Deploy → Clear build cache & deploy
```

---

**Need Help?** Open an issue in your repository or contact Render support.

**Happy Deploying! 🚀**
