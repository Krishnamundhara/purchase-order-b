import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { pool } from '../db/connection.js';

interface UserRow {
  id: string;
  username: string;
  password: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

// Extend Express User type
declare global {
  namespace Express {
    interface User extends UserProfile {}
  }
}

// LocalStrategy for username/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username: string, password: string, done: any) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
          return done(null, false, { message: 'Incorrect username.' });
        }

        const user = result.rows[0] as UserRow;

        if (!user.is_active) {
          return done(null, false, { message: 'User account is inactive.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        const userProfile: UserProfile = {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          is_active: user.is_active,
        };

        return done(null, userProfile);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user for session storage
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const result = await pool.query('SELECT id, username, email, full_name, is_active FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return done(null, false);
    }

    const user = result.rows[0] as UserProfile;
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
