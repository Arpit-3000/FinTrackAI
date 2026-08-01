# Backend Setup Instructions

## ✅ Quick Start

### 1. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

Backend should start on `http://localhost:5000`

### 2. Check if Backend is Running

Open browser and visit:
- `http://localhost:5000/api` - Should show API info
- Check terminal for "Server running on port 5000"

### 3. Configure API URL in App

**For iOS Simulator:**
```
http://localhost:5000/api
```

**For Android Emulator:**
```
http://10.0.2.2:5000/api
```

**For Physical Device:**
```
http://YOUR_COMPUTER_IP:5000/api
```

Update in: `FinTrackAInew/src/constants/index.ts`

## 📝 Backend Requirements

1. MongoDB installed and running
2. Node.js v18+ installed
3. Environment variables configured in `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fintrack
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

## 🔍 Troubleshooting

### Backend Not Starting?

1. Check MongoDB is running:
   ```bash
   mongod --version
   ```

2. Check if port 5000 is already in use:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

3. Check backend logs for errors

### App Can't Connect to Backend?

1. Check backend server is running
2. Check API_BASE_URL in `src/constants/index.ts`
3. Check network connection
4. For physical device, ensure device and computer are on same WiFi

### No Data Showing in Dashboard?

1. Make sure you're logged in
2. Check if transactions exist in database
3. Check browser console/logs for errors
4. Try creating a test transaction

## 🧪 Test Backend Endpoints

Using cURL or Postman:

```bash
# Health check
curl http://localhost:5000/api

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get dashboard (need token from login)
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📱 App Features

The app will automatically:
- Show loading states while fetching data
- Calculate totals from transactions if analytics API fails
- Show helpful error messages
- Add console logs for debugging

Check React Native debugger console for detailed logs:
- 🏠 Dashboard loading
- ✅ Success messages
- ❌ Error messages
- 📊 Data received

---

**Need Help?** Check the logs in:
1. Backend terminal
2. React Native Metro bundler
3. React Native debugger console
