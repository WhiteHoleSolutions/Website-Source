# DEPLOYMENT CHECKLIST - Render.com

## ✅ Pre-Deployment Checklist

### 1. Files Ready
- [x] All files in Final_Site folder
- [x] package.json with correct dependencies
- [x] .gitignore properly configured
- [x] README.md created
- [x] File paths updated for production

### 2. Test Locally
```bash
cd Final_Site
npm install
npm start
```
Then test:
- [ ] Main site loads: http://localhost:3000
- [ ] Admin panel loads: http://localhost:3000/admin.html
- [ ] Gallery displays correctly
- [ ] Inquiry form submits
- [ ] Admin login works (CTRL+`, password: admin123)
- [ ] Image uploads work in admin panel

## 📦 GitHub Setup

### Push to GitHub
```bash
cd Final_Site
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 🚀 Render.com Setup

### 1. Create Web Service
1. Go to https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select your repository

### 2. Configure Service
```
Name: white-hole-solutions
Region: (Choose closest to you)
Branch: main
Root Directory: (leave empty)
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free (or upgrade for better performance)
```

### 3. Environment Variables (Optional)
```
NODE_ENV=production
PORT=3000
```

### 4. Deploy
Click "Create Web Service" and wait for deployment.

## ⚠️ Important Notes

### Persistent Storage Issue
**Render's free tier uses ephemeral storage!**

This means:
- Database resets on each deployment
- Uploaded images are lost on restart

### Solutions:

#### Option A: Upgrade to Paid Plan with Disk
1. In your service settings, add a **Render Disk**
2. Mount to: `/app/uploads` and create persistent database location
3. Cost: ~$1/month for 1GB

#### Option B: Use External Services (Recommended)
1. **Database**: PostgreSQL (Render offers free tier)
   - Modify database.js to use pg instead of sqlite3
   - More scalable for production

2. **File Storage**: Use cloud storage
   - AWS S3 (free tier available)
   - Cloudinary (free tier: 25GB)
   - Modify server.js to upload to cloud instead of local

## 🔒 Security Changes for Production

### 1. Change Admin Password
Edit: `public/js/admin-access.js`
```javascript
this.adminPassword = 'YOUR_SECURE_PASSWORD_HERE';
```

### 2. Add Rate Limiting
Install: `npm install express-rate-limit`

Add to server.js:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Enable CORS for Your Domain Only
Edit server.js:
```javascript
app.use(cors({
  origin: 'https://your-domain.onrender.com'
}));
```

## 📊 Post-Deployment Testing

After deployment, test:
- [ ] Website loads on your Render URL
- [ ] All pages navigate correctly
- [ ] Gallery images load
- [ ] Inquiry form submits
- [ ] Admin panel is accessible
- [ ] Mobile responsiveness works
- [ ] HTTPS is enabled (Render auto-provides SSL)

## 🔄 Updates and Maintenance

### To Deploy Updates:
```bash
git add .
git commit -m "Update description"
git push
```
Render auto-deploys on push to main branch.

### View Logs:
- Go to Render Dashboard → Your Service → Logs
- Monitor for errors or issues

## 📈 Monitoring

### Render Provides:
- Automatic HTTPS
- Free SSL certificates
- Health checks
- Deployment history
- Real-time logs

### Things to Monitor:
- Service uptime
- Database size (if using external)
- Image storage usage
- API response times

## 💡 Performance Tips

1. **Enable Compression**
   ```bash
   npm install compression
   ```
   Add to server.js:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Optimize Images**
   - Compress images before upload
   - Consider adding image optimization library

3. **Caching**
   - Set cache headers for static files
   - Use CDN for better performance

## 🆘 Troubleshooting

### Site Not Loading
- Check Render logs for errors
- Verify build command completed
- Check port configuration (should be process.env.PORT)

### Database Issues
- Remember: SQLite resets on free tier
- Consider migrating to PostgreSQL

### File Upload Errors
- Check uploads directory exists
- Verify file size limits
- Consider external storage solution

## 📱 Custom Domain (Optional)

To use your own domain:
1. Go to Render Dashboard → Your Service → Settings
2. Add custom domain
3. Update DNS records as instructed
4. SSL certificate auto-generated

## ✅ Final Checklist Before Going Live

- [ ] Tested all features locally
- [ ] Changed admin password
- [ ] Added rate limiting
- [ ] Configured CORS properly
- [ ] Set up persistent storage solution
- [ ] Pushed to GitHub
- [ ] Deployed to Render
- [ ] Tested live site thoroughly
- [ ] Set up monitoring/alerts
- [ ] Documented admin credentials securely

## 🎉 You're Live!

Your website is now live at: `https://your-app-name.onrender.com`

Share it with the world! 🚀
