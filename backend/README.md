# FinTrack AI Backend

Complete REST API for FinTrack AI financial tracking application built with Node.js, Express, MongoDB, and JWT authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Registration, login, profile updates, password reset
- **Transaction Management**: Full CRUD operations with filtering and pagination
- **Budget Tracking**: Create and manage budgets with automatic spending calculations
- **Analytics**: Comprehensive financial analytics and insights
- **Security**: Rate limiting, helmet, mongo sanitize, CORS
- **Validation**: Express-validator for request validation
- **Error Handling**: Centralized error handling middleware

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── transactionController.js
│   │   ├── budgetController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Transaction.js       # Transaction schema
│   │   └── Budget.js            # Budget schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── transactions.js      # Transaction routes
│   │   ├── budgets.js           # Budget routes
│   │   └── analytics.js         # Analytics routes
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── errorHandler.js      # Error handling
│   │   └── validators.js        # Request validation
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   └── server.js                # Express app
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fintrack-ai
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:19006
```

### 3. Start MongoDB
Make sure MongoDB is running:
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas cloud database
```

### 4. Run Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login user | ❌ |
| GET | `/me` | Get current user | ✅ |
| POST | `/forgot-password` | Send OTP to email | ❌ |
| POST | `/verify-otp` | Verify OTP code | ❌ |
| POST | `/reset-password` | Reset password | ❌ |
| PUT | `/profile` | Update profile | ✅ |
| POST | `/logout` | Logout user | ✅ |

### Transactions (`/api/transactions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all transactions | ✅ |
| GET | `/:id` | Get single transaction | ✅ |
| POST | `/` | Create transaction | ✅ |
| PUT | `/:id` | Update transaction | ✅ |
| DELETE | `/:id` | Delete transaction | ✅ |
| GET | `/stats/summary` | Get statistics | ✅ |

### Budgets (`/api/budgets`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all budgets | ✅ |
| GET | `/:id` | Get single budget | ✅ |
| POST | `/` | Create budget | ✅ |
| PUT | `/:id` | Update budget | ✅ |
| DELETE | `/:id` | Delete budget | ✅ |
| GET | `/summary/overview` | Get budget summary | ✅ |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Get dashboard data | ✅ |
| GET | `/detailed` | Get detailed analytics | ✅ |
| GET | `/comparison` | Get monthly comparison | ✅ |
| GET | `/top-categories` | Get top categories | ✅ |

## 📝 API Usage Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Transaction
```bash
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expense",
  "category": "Food & Dining",
  "amount": 45.50,
  "description": "Lunch at restaurant",
  "date": "2024-01-15T12:00:00Z",
  "emoji": "🍔",
  "paymentMethod": "card"
}
```

### Get Transactions with Filters
```bash
GET /api/transactions?type=expense&category=Food&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20
Authorization: Bearer <token>
```

### Create Budget
```bash
POST /api/budgets
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "Food & Dining",
  "amount": 500,
  "period": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "emoji": "🍔",
  "color": "#FF9500",
  "alertThreshold": 80
}
```

### Get Dashboard Analytics
```bash
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### How it works:
1. User registers or logs in
2. Server returns JWT token
3. Client includes token in subsequent requests
4. Format: `Authorization: Bearer <token>`

### Token Expiration:
- Access Token: 7 days (configurable)
- Refresh Token: 30 days (configurable)

## 🛡️ Security Features

- **Helmet**: Sets security HTTP headers
- **CORS**: Cross-Origin Resource Sharing
- **Rate Limiting**: Prevents brute force attacks
- **Mongo Sanitize**: Prevents NoSQL injection
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: Express-validator
- **Error Handling**: Never exposes sensitive info

## 📊 Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  avatar: String,
  verified: Boolean,
  resetPasswordToken: String,
  otpCode: String,
  otpExpire: Date,
  lastLogin: Date,
  timestamps: true
}
```

### Transaction Model
```javascript
{
  user: ObjectId (required),
  type: String (income/expense),
  category: String (required),
  amount: Number (required),
  description: String,
  date: Date,
  emoji: String,
  paymentMethod: String,
  tags: [String],
  notes: String,
  timestamps: true
}
```

### Budget Model
```javascript
{
  user: ObjectId (required),
  category: String (required),
  amount: Number (required),
  spent: Number,
  period: String (daily/weekly/monthly/yearly),
  startDate: Date (required),
  endDate: Date (required),
  emoji: String,
  color: String,
  alertThreshold: Number,
  isActive: Boolean,
  notifications: Object,
  timestamps: true
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Performance

- **Compression**: Gzip compression enabled
- **Database Indexing**: Optimized queries
- **Pagination**: Limit large result sets
- **Caching**: Ready for Redis integration

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fintrack
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://your-app.com
```

### Deployment Platforms
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean**: App Platform
- **AWS**: Elastic Beanstalk or EC2
- **Vercel/Netlify**: Serverless functions

## 🐛 Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

## 📦 Dependencies

**Production:**
- express: Web framework
- mongoose: MongoDB ODM
- bcryptjs: Password hashing
- jsonwebtoken: JWT authentication
- dotenv: Environment variables
- cors: CORS middleware
- helmet: Security headers
- express-validator: Request validation
- compression: Response compression
- express-rate-limit: Rate limiting
- express-mongo-sanitize: NoSQL injection prevention
- morgan: HTTP request logger

**Development:**
- nodemon: Auto-reload server
- jest: Testing framework
- supertest: HTTP testing

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 👨‍💻 Author

FinTrack AI Team

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@fintrack-ai.com

---

**Built with ❤️ using Node.js, Express, and MongoDB**
