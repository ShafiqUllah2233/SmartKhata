# Smart Khata - Deployment Guide

## Architecture
- **Frontend**: React (Vite) → Deploy on Vercel
- **Backend**: Node.js/Express → Deploy on Vercel (serverless)
- **Database**: MongoDB Atlas (free tier)

---

## Step 1: Set Up MongoDB Atlas (Free Cloud Database)

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a **free** account (or sign in with Google)
3. Click **"Build a Database"** → Choose **M0 FREE** tier
4. Select a region close to you (e.g., AWS Mumbai for South Asia)
5. Set a **Database Username** and **Password** (save these!)
6. Click **"Create Database User"** then **"Finish and Close"**

### Allow All IPs (Required for Vercel)
1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
4. Click **Confirm**

### Get Connection String
1. Go to **Database** → Click **"Connect"**
2. Choose **"Drivers"**
3. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add a database name before the `?`:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smart-khata?retryWrites=true&w=majority
   ```

---

## Step 2: Push Code to GitHub

### Create Two GitHub Repositories
1. Go to [https://github.com/new](https://github.com/new)
2. Create repo: `smart-khata-backend` (private)
3. Create repo: `smart-khata-frontend` (private)

### Push Backend
```bash
cd backend
git init
git add .
git commit -m "Initial commit - Smart Khata Backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-khata-backend.git
git push -u origin main
```

### Push Frontend
```bash
cd frontend
git init
git add .
git commit -m "Initial commit - Smart Khata Frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-khata-frontend.git
git push -u origin main
```

---

## Step 3: Deploy Backend on Vercel

1. Go to [https://vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New" → "Project"**
3. Import `smart-khata-backend` repository
4. **Framework Preset**: Select **Other**
5. Click **"Environment Variables"** and add:

   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smart-khata?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `smartkhata_super_secret_key_2026` |
   | `JWT_EXPIRE` | `7d` |
   | `NODE_ENV` | `production` |
   | `ADMIN_EMAIL` | `shafiqullahkhan033@gmail.com` |
   | `FRONTEND_URL` | (leave empty for now, add after deploying frontend) |

6. Click **"Deploy"**
7. After deployment, note your backend URL: `https://smart-khata-backend-xxx.vercel.app`

---

## Step 4: Deploy Frontend on Vercel

1. In Vercel, click **"Add New" → "Project"**
2. Import `smart-khata-frontend` repository
3. **Framework Preset**: Select **Vite**
4. Click **"Environment Variables"** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://smart-khata-backend-xxx.vercel.app/api` |

   *(Replace with your actual backend URL from Step 3)*

5. Click **"Deploy"**
6. Your frontend URL: `https://smart-khata-frontend-xxx.vercel.app`

---

## Step 5: Update Backend FRONTEND_URL

1. Go to your **backend project** on Vercel
2. Go to **Settings** → **Environment Variables**
3. Add/update:
   - `FRONTEND_URL` = `https://smart-khata-frontend-xxx.vercel.app`
4. Go to **Deployments** → Click **"Redeploy"** on the latest deployment

---

## Step 6: Register & Set Admin

1. Open your frontend URL in the browser
2. **You** (admin) should register first with email: `shafiqullahkhan033@gmail.com`
   - This email matches `ADMIN_EMAIL` env var → automatically gets admin role
3. After login, you'll see the **Admin** tab in the navbar
4. Share the URL with your 6 friends → they register with their own accounts
5. Each friend gets their own separate data (customers, transactions)

---

## Admin Features
- **Admin Panel**: See all registered users and their stats
- **Delete Users**: Remove any user and their data
- **Monitor**: Track total users, customers, and transactions

---

## Custom Domain (Optional)
1. In Vercel, go to your frontend project → **Settings** → **Domains**
2. Add your custom domain (e.g., `khata.yourdomain.com`)
3. Follow DNS instructions provided by Vercel

---

## Troubleshooting

### "Network Error" on frontend
- Make sure `VITE_API_URL` points to your backend URL with `/api` at the end
- Make sure CORS is configured: `FRONTEND_URL` in backend env vars

### "Not authorized" errors
- Log out and log back in to refresh your token

### Admin tab not showing
- Make sure you registered with the email set in `ADMIN_EMAIL`
- Log out and log back in after the role is assigned

### MongoDB connection fails
- Check your Atlas Network Access allows `0.0.0.0/0`
- Verify your connection string password is correct
