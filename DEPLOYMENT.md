# Render Deployment Checklist

Use this checklist when deploying to Render for the first time.

## Pre-Deployment Checklist

- [ ] MongoDB Atlas database is set up and running
- [ ] MongoDB user created with read/write permissions
- [ ] MongoDB Network Access configured (allow `0.0.0.0/0`)
- [ ] ImgBB API key obtained
- [ ] Code pushed to GitHub repository
- [ ] All files committed:
  - [ ] `render.yaml`
  - [ ] `requirements.txt`
  - [ ] `build.sh`
  - [ ] `.env.example`

## Deployment Steps

### 1. Create Render Service

- [ ] Go to https://dashboard.render.com/
- [ ] Click "New +" → "Blueprint"
- [ ] Connect GitHub repository
- [ ] Select your repository
- [ ] Click "Apply" (Render detects `render.yaml` automatically)

### 2. Configure Environment Variables

After blueprint is applied, go to your web service settings:

**Required Variables:**
- [ ] `MONGODB_URI` - Your MongoDB connection string
  ```
  mongodb+srv://username:password@cluster.mongodb.net/card_inventory?retryWrites=true&w=majority
  ```
- [ ] `IMGBB_API_KEY` - Your ImgBB API key

**Auto-configured (verify):**
- [ ] `SECRET_KEY` - Auto-generated
- [ ] `FLASK_ENV` - Set to `production`
- [ ] `FLASK_DEBUG` - Set to `False`
- [ ] `PYTHON_VERSION` - Set to `3.11.0`

### 3. First Deployment

- [ ] Click "Manual Deploy" → "Deploy latest commit"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Check build logs for errors
- [ ] Once deployed, service will be at: `https://your-app-name.onrender.com`

### 4. Test Deployment

- [ ] Visit your app URL
- [ ] Wait for app to wake up (30-60 seconds on first request)
- [ ] Test basic functionality:
  - [ ] Dashboard loads
  - [ ] Can create card definition
  - [ ] Can upload image
  - [ ] Can add inventory item
  - [ ] Database operations work

### 5. Post-Deployment

- [ ] Bookmark your app URL
- [ ] Set up monitoring (optional):
  - [ ] UptimeRobot to prevent sleeping
  - [ ] Email alerts for downtime
- [ ] Document your service name and URL

## Common Issues

### Build Fails
- Check build logs in Render dashboard
- Verify all dependencies in `requirements.txt`
- Ensure `build.sh` is executable

### App Won't Start
- Check application logs
- Verify environment variables are correct
- Ensure MongoDB URI is valid

### MongoDB Connection Error
- Verify MongoDB Network Access allows `0.0.0.0/0`
- Check MongoDB user permissions
- Verify connection string format

### App Times Out
- Free tier spins down after 15 minutes
- First request after sleep takes 30-60 seconds
- This is normal behavior for free tier

## Environment Variables Reference

| Variable | Source | Required | Example |
|----------|--------|----------|---------|
| MONGODB_URI | MongoDB Atlas | Yes | `mongodb+srv://...` |
| IMGBB_API_KEY | ImgBB API | Yes | `abc123def456` |
| SECRET_KEY | Auto-generated | Yes | Auto |
| FLASK_ENV | render.yaml | Yes | `production` |
| FLASK_DEBUG | render.yaml | Yes | `False` |
| PYTHON_VERSION | render.yaml | Yes | `3.11.0` |

## Updating After Deployment

To push updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically detect and deploy the changes.

## Monitoring

Access from Render dashboard:
- **Logs**: Real-time application logs
- **Metrics**: Performance and resource usage
- **Events**: Deployment history

## Support

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Support](https://www.mongodb.com/docs/atlas/)
- [Project Issues](https://github.com/your-repo/issues)
