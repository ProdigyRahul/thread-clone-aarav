import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initiate Google OAuth login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=Failed to login with Google`,
    session: false 
  }),
  (req, res) => {
    try {
      // Create JWT token
      const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: '15d',
      });

      // Set cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        sameSite: 'strict',
      });

      // Prepare user data to send
      const userData = {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        profilePic: req.user.profilePic,
        bio: req.user.bio,
      };

      // Redirect to frontend with user data
      const userDataStr = encodeURIComponent(JSON.stringify(userData));
      res.redirect(`${process.env.FRONTEND_URL}?authSuccess=true&userData=${userDataStr}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth?error=Server error`);
    }
  }
);

export default router; 