import express, { Request, Response, NextFunction } from 'express';
import passport from '../middleware/passport.js';
import bcrypt from 'bcrypt';
import { pool } from '../db/connection.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const SignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
});

type LoginData = z.infer<typeof LoginSchema>;
type SignupData = z.infer<typeof SignupSchema>;

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
};

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const data = SignupSchema.parse(req.body);

    // Check if username already exists
    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [data.username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Check if email already exists
    if (data.email) {
      const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name',
      [data.username, data.email || null, hashedPassword, data.full_name || null]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Error registering user' });
  }
});

// POST /api/auth/login - Authenticate user
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  // Validate input
  try {
    LoginSchema.parse(req.body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: err.errors });
    }
  }
  
  passport.authenticate('local', (err: any, user: any, info: any) => {
    try {
      if (err) {
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Login failed' });
        }

        res.json({
          success: true,
          message: 'Logged in successfully',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
          },
        });
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Error during login' });
    }
  })(req, res, next);
});

// GET /api/auth/me - Get current user
router.get('/me', isAuthenticated, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logOut((err: any) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/auth/status - Check authentication status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user || null,
  });
});

export default router;
