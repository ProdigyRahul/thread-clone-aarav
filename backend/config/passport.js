import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import { generateRandomUsername } from '../utils/helpers/generateUsername.js';

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const configurePassport = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user with same email exists
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }
      
      // Generate a unique username based on name
      const baseUsername = profile.displayName.toLowerCase().replace(/\s+/g, "");
      const username = await generateRandomUsername(baseUsername);
      
      // Create new user
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        username: username,
        googleId: profile.id,
        profilePic: profile.photos[0].value || "",
      });
      
      await newUser.save();
      return done(null, newUser);
      
    } catch (error) {
      return done(error, null);
    }
  }));
};

export default configurePassport; 