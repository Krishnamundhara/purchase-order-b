# Passport-Local Authentication Implementation

## Overview
Successfully implemented Passport.js with passport-local strategy for user authentication in the Purchase Order Backend.

## Features Implemented

### 1. **Authentication Strategy**
- ✅ Passport-Local strategy for username/password authentication
- ✅ Password hashing with bcryptjs
- ✅ Session-based authentication with express-session
- ✅ Serialization and deserialization of users

### 2. **API Endpoints**

#### POST `/api/auth/signup`
Register a new user
- **Body:**
  ```json
  {
    "username": "newuser",
    "password": "securepassword",
    "email": "user@example.com",
    "full_name": "Full Name (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": "uuid",
      "username": "newuser",
      "email": "user@example.com",
      "full_name": "Full Name"
    }
  }
  ```
- **Validation:**
  - Username: minimum 3 characters
  - Password: minimum 6 characters
  - Email: valid email format
  - Prevents duplicate usernames and emails

#### POST `/api/auth/login`
Authenticate user with credentials
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Administrator"
    }
  }
  ```
- **Error Responses:**
  - 401: Invalid credentials
  - 400: Validation errors

#### POST `/api/auth/logout`
Logout the current user
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### GET `/api/auth/me`
Get current authenticated user (requires authentication)
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Administrator"
    }
  }
  ```
- **Error:** 401 if not authenticated

#### GET `/api/auth/status`
Check authentication status (public endpoint)
- **Response:**
  ```json
  {
    "success": true,
    "isAuthenticated": true,
    "user": { /* user object if authenticated */ }
  }
  ```

### 3. **Security Features**
- ✅ Password hashing using bcryptjs (10 salt rounds)
- ✅ Session-based authentication with httpOnly cookies
- ✅ CSRF protection through SameSite cookie policy
- ✅ Input validation with Zod schemas
- ✅ Duplicate username/email prevention
- ✅ Secure session configuration

### 4. **Database Schema**
Users table includes:
- `id` (UUID) - Primary key
- `username` (TEXT) - Unique
- `password` (TEXT) - Hashed
- `email` (TEXT) - Unique, optional
- `full_name` (TEXT) - Optional
- `is_active` (BOOLEAN) - Default: true
- `created_at` (TIMESTAMPTZ) - Auto
- `updated_at` (TIMESTAMPTZ) - Auto

Indexes:
- `idx_users_username` - Fast username lookups
- `idx_users_email` - Fast email lookups

### 5. **Default Admin Account**
- **Username:** admin
- **Password:** admin123
- **Email:** admin@example.com
- **Full Name:** Administrator

⚠️ **Remember to change these credentials in production!**

## Configuration

### Environment Variables (.env)
```
PORT=4000
DATABASE_URL=your_postgres_connection_string
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-secret-key-change-this-in-production
```

### Session Configuration
- **Duration:** 24 hours
- **Secure:** true (production only)
- **HttpOnly:** true (prevents client-side JS access)
- **SameSite:** lax (CSRF protection)
- **Domain:** Auto-detected

## Files Modified/Created

1. **src/middleware/passport.ts** (NEW)
   - Passport strategy configuration
   - Local strategy setup
   - User serialization/deserialization

2. **src/routes/auth.ts** (NEW)
   - All authentication endpoints
   - Input validation with Zod
   - Auth middleware (`isAuthenticated`)

3. **src/index.ts** (MODIFIED)
   - Added express-session middleware
   - Added Passport initialization
   - Added auth routes

4. **src/db/init.ts** (MODIFIED)
   - Updated to hash admin password on init
   - Uses bcryptjs for hashing

5. **.env** (MODIFIED)
   - Added SESSION_SECRET

## Dependencies Installed

```
passport@^0.7.0
passport-local@^1.0.0
express-session@^1.17.3
bcryptjs@^2.4.3
@types/passport-local@^1.0.38
@types/express-session@^1.17.11
@types/bcryptjs@^2.4.5
```

## Usage Example (Frontend Integration)

### Signup
```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john',
    password: 'secure123',
    email: 'john@example.com',
    full_name: 'John Doe'
  })
});
```

### Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});
```

### Check Auth Status
```javascript
const response = await fetch('/api/auth/status', {
  credentials: 'include'
});
const data = await response.json();
console.log(data.isAuthenticated); // true/false
```

### Logout
```javascript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

## Testing

### Test with cURL

**Signup:**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "full_name": "Test User"
  }' \
  -c cookies.txt
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -c cookies.txt
```

**Check Status:**
```bash
curl http://localhost:4000/api/auth/status \
  -b cookies.txt
```

**Get Current User:**
```bash
curl http://localhost:4000/api/auth/me \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt
```

## Security Considerations

1. **Change Session Secret:** Always change `SESSION_SECRET` in production
2. **Use HTTPS:** Always use secure cookies in production
3. **Database Security:** Use strong passwords for database credentials
4. **Password Policy:** Consider enforcing stronger password requirements
5. **Rate Limiting:** Implement rate limiting for login/signup endpoints
6. **Account Lockout:** Consider implementing account lockout after failed attempts

## Next Steps

1. Update frontend to use authentication endpoints
2. Implement protected routes middleware
3. Add rate limiting for auth endpoints
4. Implement password reset functionality
5. Add email verification for new accounts
6. Implement refresh token mechanism if needed

## Status
✅ **COMPLETE AND TESTED**
