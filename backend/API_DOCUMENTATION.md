# FinTrack AI - Complete API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📌 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "avatar": "👤",
      "verified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "avatar": "👤",
      "verified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User
**GET** `/auth/me` 🔒

Get logged-in user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "avatar": "👤",
      "verified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4. Forgot Password
**POST** `/auth/forgot-password`

Send OTP to user's email for password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "otp": "123456"
}
```

---

### 5. Verify OTP
**POST** `/auth/verify-otp`

Verify the OTP code sent to email.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### 6. Reset Password
**POST** `/auth/reset-password`

Reset password using verified OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "newPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### 7. Update Profile
**PUT** `/auth/profile` 🔒

Update user profile information.

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1987654321",
  "avatar": "👨‍💼"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Updated",
      "email": "john@example.com",
      "phone": "+1987654321",
      "avatar": "👨‍💼"
    }
  }
}
```

---

## 💰 Transaction Endpoints

### 1. Get All Transactions
**GET** `/transactions` 🔒

Get user's transactions with filtering and pagination.

**Query Parameters:**
- `type` (optional): "income" or "expense"
- `category` (optional): Filter by category
- `search` (optional): Search in description/category
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page
- `sortBy` (optional, default: "date"): Sort field
- `sortOrder` (optional, default: "desc"): "asc" or "desc"

**Example:**
```
GET /transactions?type=expense&category=Food&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "count": 20,
  "total": 156,
  "pages": 8,
  "currentPage": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439012",
      "type": "expense",
      "category": "Food & Dining",
      "amount": 45.50,
      "description": "Lunch at restaurant",
      "date": "2024-01-15T12:00:00.000Z",
      "emoji": "🍔",
      "paymentMethod": "card",
      "tags": ["food", "lunch"],
      "createdAt": "2024-01-15T12:05:00.000Z",
      "updatedAt": "2024-01-15T12:05:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Transaction
**GET** `/transactions/:id` 🔒

Get specific transaction details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "type": "expense",
    "category": "Food & Dining",
    "amount": 45.50,
    "description": "Lunch at restaurant",
    "date": "2024-01-15T12:00:00.000Z",
    "emoji": "🍔",
    "paymentMethod": "card"
  }
}
```

---

### 3. Create Transaction
**POST** `/transactions` 🔒

Create a new transaction.

**Request Body:**
```json
{
  "type": "expense",
  "category": "Food & Dining",
  "amount": 45.50,
  "description": "Lunch at restaurant",
  "date": "2024-01-15T12:00:00Z",
  "emoji": "🍔",
  "paymentMethod": "card",
  "tags": ["food", "lunch"],
  "notes": "Had a great meal"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "type": "expense",
    "category": "Food & Dining",
    "amount": 45.50,
    "description": "Lunch at restaurant",
    "date": "2024-01-15T12:00:00.000Z",
    "emoji": "🍔",
    "paymentMethod": "card",
    "tags": ["food", "lunch"],
    "notes": "Had a great meal",
    "createdAt": "2024-01-15T12:05:00.000Z",
    "updatedAt": "2024-01-15T12:05:00.000Z"
  }
}
```

---

### 4. Update Transaction
**PUT** `/transactions/:id` 🔒

Update an existing transaction.

**Request Body:**
```json
{
  "amount": 50.00,
  "description": "Updated lunch amount"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "amount": 50.00,
    "description": "Updated lunch amount"
  }
}
```

---

### 5. Delete Transaction
**DELETE** `/transactions/:id` 🔒

Delete a transaction.

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

### 6. Get Transaction Statistics
**GET** `/transactions/stats/summary` 🔒

Get summary statistics for transactions.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "income": 5000,
      "expense": 3250,
      "balance": 1750,
      "totalTransactions": 156
    },
    "byCategory": [
      {
        "_id": {
          "type": "expense",
          "category": "Food & Dining"
        },
        "total": 685,
        "count": 42
      }
    ]
  }
}
```

---

## 💳 Budget Endpoints

### 1. Get All Budgets
**GET** `/budgets` 🔒

Get user's budgets.

**Query Parameters:**
- `period` (optional): "daily", "weekly", "monthly", "yearly"
- `isActive` (optional): "true" or "false"
- `category` (optional): Filter by category

**Response (200):**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439012",
      "category": "Food & Dining",
      "amount": 800,
      "spent": 685,
      "remaining": 115,
      "percentage": 85.6,
      "period": "monthly",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.000Z",
      "emoji": "🍔",
      "color": "#FF9500",
      "alertThreshold": 80,
      "isActive": true
    }
  ]
}
```

---

### 2. Create Budget
**POST** `/budgets` 🔒

Create a new budget.

**Request Body:**
```json
{
  "category": "Food & Dining",
  "amount": 800,
  "period": "monthly",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "emoji": "🍔",
  "color": "#FF9500",
  "alertThreshold": 80
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "category": "Food & Dining",
    "amount": 800,
    "spent": 0,
    "remaining": 800,
    "percentage": 0
  }
}
```

---

### 3. Update Budget
**PUT** `/budgets/:id` 🔒

Update budget details.

**Request Body:**
```json
{
  "amount": 900,
  "alertThreshold": 85
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Budget updated successfully",
  "data": { ... }
}
```

---

### 4. Delete Budget
**DELETE** `/budgets/:id` 🔒

Delete a budget.

**Response (200):**
```json
{
  "success": true,
  "message": "Budget deleted successfully"
}
```

---

### 5. Get Budget Summary
**GET** `/budgets/summary/overview` 🔒

Get comprehensive budget overview.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "monthly": {
      "total": 5000,
      "spent": 3250,
      "remaining": 1750,
      "percentage": "65.0"
    },
    "categories": [ ... ],
    "warnings": [
      {
        "id": "507f1f77bcf86cd799439011",
        "category": "Bills & Utilities",
        "emoji": "📱",
        "message": "You've spent 97.5% of your budget",
        "severity": "high"
      }
    ],
    "exceeded": [],
    "topCategories": [ ... ]
  }
}
```

---

## 📊 Analytics Endpoints

### 1. Get Dashboard Analytics
**GET** `/analytics/dashboard` 🔒

Get dashboard overview data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "income": 5000,
      "expense": 3250,
      "savings": 1750,
      "savingsRate": "35.0"
    },
    "recentTransactions": [ ... ],
    "monthlySpending": [
      {
        "month": "2024-01",
        "amount": 3250
      }
    ],
    "categoryBreakdown": [
      {
        "category": "Food & Dining",
        "amount": 685,
        "count": 42,
        "percentage": "21.1"
      }
    ]
  }
}
```

---

### 2. Get Detailed Analytics
**GET** `/analytics/detailed` 🔒

Get detailed analytics with trends.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [ ... ],
    "categoryAnalysis": [ ... ],
    "weeklyAnalysis": [ ... ],
    "paymentMethods": [ ... ]
  }
}
```

---

### 3. Get Monthly Comparison
**GET** `/analytics/comparison` 🔒

Compare current month with previous month.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentMonth": {
      "income": 5000,
      "expense": 3250,
      "savings": 1750
    },
    "previousMonth": {
      "income": 4500,
      "expense": 3100,
      "savings": 1400
    },
    "changes": {
      "income": {
        "amount": 500,
        "percentage": "11.1"
      },
      "expense": {
        "amount": 150,
        "percentage": "4.8"
      }
    }
  }
}
```

---

### 4. Get Top Categories
**GET** `/analytics/top-categories` 🔒

Get top spending/earning categories.

**Query Parameters:**
- `type` (optional, default: "expense"): "income" or "expense"
- `limit` (optional, default: 10): Number of categories
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "category": "Food & Dining",
      "total": 685,
      "count": 42,
      "avgAmount": "16.31",
      "percentage": "21.1"
    }
  ]
}
```

---

## ❌ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Transaction not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Server error",
  "stack": "..." // Only in development
}
```

---

## 📝 Notes

- 🔒 indicates protected routes (JWT required)
- All dates should be in ISO 8601 format
- Pagination defaults: page=1, limit=50
- Rate limit: 100 requests per 15 minutes per IP
- Token expires after 7 days (configurable)

---

**Happy Coding! 🚀**
