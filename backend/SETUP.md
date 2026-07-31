# FinTrack AI Backend - Setup Guide

Complete setup instructions for the FinTrack AI backend server.

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm** (comes with Node.js)
  - Verify: `npm --version`

- **MongoDB** (v6.0 or higher)
  - Option 1: Local installation from https://www.mongodb.com/try/download/community
  - Option 2: MongoDB Atlas (cloud) from https://www.mongodb.com/atlas

- **Git** (optional, for version control)
  - Download: https://git-scm.com/

## 📦 Step 1: Install Dependencies

Navigate to the backend directory and install packages:

```bash
cd FinTrackAI/backend
npm install
```

This will install:
- express, mongoose, bcryptjs, jsonwebtoken
- cors, helmet, compression, morgan
- express-validator, express-rate-limit
- express-mongo-sanitize
- nodemon (dev dependency)

## ⚙️ Step 2: Configure Environment

### Create .env file

```bash
cp .env.example .env
```

### Edit .env with your configuration

**For Local Development:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fintrack-ai
JWT_SECRET=your-random-secret-key-change-this
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another-random-secret-key
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:19006
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fintrack-ai?retryWrites=true&w=majority
```

### Generate Secure JWT Secrets

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 64
```

## 🗄️ Step 3: Setup MongoDB

### Option A: Local MongoDB

**Install MongoDB:**
- Windows: Download MSI from mongodb.com
- macOS: `brew install mongodb-community`
- Linux: Follow official docs

**Start MongoDB:**
```bash
# macOS/Linux
mongod --dbpath /path/to/data/db

# Windows
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Verify MongoDB is running:**
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/atlas
2. Sign up / Log in
3. Create a new cluster (Free tier available)
4. Create database user (username/password)
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get connection string and add to `.env`

## 🚀 Step 4: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║          🚀 FinTrack AI Backend Server               ║
║                                                       ║
║  Status: Running                                      ║
║  Port: 5000                                           ║
║  Environment: development                             ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

✅ MongoDB Connected: localhost
```

## ✅ Step 5: Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Register a Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

Save the `token` from the response for authenticated requests.

### Create a Transaction (requires token)
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "type": "expense",
    "category": "Food & Dining",
    "amount": 45.50,
    "description": "Lunch",
    "emoji": "🍔"
  }'
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=3000
```

### MongoDB Connection Failed

**Check if MongoDB is running:**
```bash
mongosh
```

**Verify connection string:**
- Local: `mongodb://localhost:27017/fintrack-ai`
- Atlas: Check username, password, cluster name

**For Atlas, ensure:**
- IP whitelist includes your IP
- Database user has read/write permissions
- Connection string uses correct format

### Module Not Found

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### JWT Token Issues

**Generate new secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in `.env`

## 🧪 Testing with Postman

1. Download Postman from https://www.postman.com/
2. Import the API collection (see API_DOCUMENTATION.md)
3. Create environment with variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (will be set after login)

## 📱 Connect React Native App

Update the API base URL in your React Native app:

**src/services/api.ts:**
```typescript
// For iOS Simulator
const API_URL = 'http://localhost:5000/api';

// For Android Emulator
const API_URL = 'http://10.0.2.2:5000/api';

// For Physical Device (use your computer's IP)
const API_URL = 'http://192.168.1.100:5000/api';
```

## 🌐 Production Deployment

### Environment Variables
```env
NODE_ENV=production
MONGODB_URI=<your-production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://your-app.com
```

### Recommended Platforms

**1. Heroku**
```bash
heroku create fintrack-api
heroku addons:create mongolab
git push heroku main
```

**2. Railway**
- Connect GitHub repository
- Add MongoDB addon
- Set environment variables
- Deploy automatically

**3. DigitalOcean App Platform**
- Create app from GitHub
- Add MongoDB database
- Configure environment
- Deploy

**4. AWS Elastic Beanstalk**
```bash
eb init
eb create fintrack-api
eb deploy
```

## 📊 Database Management

### View Database
```bash
mongosh
use fintrack-ai
db.users.find()
db.transactions.find()
db.budgets.find()
```

### Clear Collections (Development Only!)
```bash
mongosh
use fintrack-ai
db.transactions.deleteMany({})
db.budgets.deleteMany({})
db.users.deleteMany({})
```

### Backup Database
```bash
mongodump --db fintrack-ai --out ./backup
```

### Restore Database
```bash
mongorestore --db fintrack-ai ./backup/fintrack-ai
```

## 🔐 Security Best Practices

1. **Never commit .env file** (already in .gitignore)
2. **Use strong JWT secrets** (64+ random characters)
3. **Change default MongoDB credentials**
4. **Enable MongoDB authentication** in production
5. **Use HTTPS** in production
6. **Set CORS to specific domain** (not *)
7. **Keep dependencies updated**: `npm audit fix`

## 📚 Additional Resources

- **Express.js**: https://expressjs.com/
- **MongoDB**: https://docs.mongodb.com/
- **Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

## 🆘 Getting Help

If you encounter issues:

1. Check logs in terminal
2. Verify `.env` configuration
3. Ensure MongoDB is running
4. Check API documentation
5. Review error messages carefully

## ✨ Next Steps

1. ✅ Backend server running
2. 📱 Connect React Native frontend
3. 🧪 Test all API endpoints
4. 🚀 Deploy to production
5. 📊 Set up monitoring (optional)

---

**You're all set! Start building amazing features! 🎉**
