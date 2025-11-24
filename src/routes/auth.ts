import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { pool } from '../db/connection.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const SignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email format'),
  full_name: z.string().optional(),
});

const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
};

// Signup endpoint
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, password, email, full_name } = SignupSchema.parse(req.body);

    // Check if username already exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, password, email, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name',
      [username, hashedPassword, email, full_name || null]
    );

    const user = result.rows[0];

    // Auto login after signup
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error logging in' });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
        },
      });
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors,
      });
    }

    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login endpoint
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Authentication error' });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid credentials',
        });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ success: false, message: 'Error logging in' });
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
    })(req, res, next);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors,
      });
    }

    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  req.logOut((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error logging out' });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// Get current user
router.get('/me', isAuthenticated, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Check authentication status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.user : null,
  });
});

export default router;
