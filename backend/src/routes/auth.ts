// backend/src/routes/auth.ts

// Import required modules and libraries
import { Router } from 'express';               // Express Router for endpoints
import pool from '../db';                         // PostgreSQL connection pool
import bcrypt from 'bcrypt';                      // bcrypt for hashing passwords
import jwt from 'jsonwebtoken';                   // JWT for token generation
import { authenticateToken } from '../middleware/authMiddleware'; // Middleware for protected routes
import nodemailer from 'nodemailer';              // Nodemailer for sending emails
import crypto from 'crypto';                      // crypto for generating verification tokens

const router = Router(); // Create a new router instance

// Configure Nodemailer to use Gmail SMTP with your app-specific password
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail's default SMTP settings
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address (e.g., galomer6708@gmail.com)
    pass: process.env.EMAIL_PASS  // Your Gmail app-specific password
  }
});

/**
 * POST /api/auth/register
 * Registers a new user, generates a verification token, and sends a verification email.
 */
router.post('/register', async (req, res) => {
  // Extract registration fields from the request body
  const { email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions } = req.body;
  try {
    // Check if the email already exists in the database
    const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if ((existingUser.rowCount ?? 0) > 0) {
      return res.status(400).json({ error: "Your email is already registered. Please login." });
    }
    
    // Hash the password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a unique verification token (32 random bytes converted to hex)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert the new user into the database; 'is_verified' defaults to false
    const result = await pool.query(
      `INSERT INTO users (email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [email, hashedPassword, height, weight, age, occupation, exercise_frequency, sex, medical_conditions, verificationToken]
    );

    // Construct the verification URL using the generated token
    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

    // Send the verification email to the user
    await transporter.sendMail({
      from: '"Ehud Fitness" <no-reply@ehudfitness.com>',
      to: email,
      subject: "Please verify your email",
      html: `<p>Thank you for registering at Ehud Fitness!</p>
             <p>Please click <a href="${verificationUrl}">this link</a> to verify your email and activate your account.</p>`
    });

    res.status(201).json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/verify-email
 * Verifies the user's email using the provided token.
 */
router.get('/verify-email', async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).send("Verification token is missing.");
  
  try {
    const result = await pool.query(`SELECT * FROM users WHERE verification_token = $1`, [token]);
    const user = result.rows[0];
    if (!user) return res.status(400).send("Invalid verification token.");

    await pool.query(
      `UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1`,
      [user.id]
    );
    res.redirect('http://localhost:3000/personal');
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Internal server error.");
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rowCount === 0) 
      return res.status(400).json({ error: "Email invalid. Please register first." });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) 
      return res.status(400).json({ error: "Incorrect password. Please try again." });

    if (!user.is_verified) 
      return res.status(403).json({ error: "Email not verified. Please check your email." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/subscribe
 * Updates the user's subscription plan details.
 * Protected route: the user must be authenticated.
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  const { subscriptionPlan, subscriptionPrice, trainingCategory } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET subscription_plan = $1, subscription_price = $2, training_category = $3 
       WHERE id = $4 RETURNING *`,
      [subscriptionPlan, subscriptionPrice, trainingCategory, userId]
    );

    // Send an email notification to the admin about the subscription update.
    const adminEmail = process.env.ADMIN_EMAIL; // Ensure ADMIN_EMAIL is defined in .env
    const updatedUser = result.rows[0];
    await transporter.sendMail({
      from: '"Ehud Fitness" <no-reply@ehudfitness.com>',
      to: adminEmail,
      subject: "New Subscription Chosen",
      html: `<p>User <strong>${updatedUser.email}</strong> has chosen a new subscription plan.</p>
             <p><strong>Training Category:</strong> ${trainingCategory}</p>
             <p><strong>Plan:</strong> ${subscriptionPlan}</p>
             <p><strong>Price:</strong> ${subscriptionPrice}</p>`
    });

    res.json({ message: "Subscription plan updated successfully", user: updatedUser });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/personal
 * Protected route to fetch user data, including subscription details.
 */
router.get('/personal', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const user = result.rows[0];
    if (!user.is_verified) 
      return res.status(403).json({ error: "Email not verified. Please check your email." });
    res.json({ user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/plan
 * Protected route for a regular user to fetch their workout plan.
 */
router.get('/plan', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query("SELECT * FROM workout_plans WHERE user_id = $1", [userId]);
    if ((result.rowCount ?? 0) > 0) {
      res.json({ plan: result.rows[0].plan });
    } else {
      res.json({ plan: {} });
    }
  } catch (error: any) {
    console.error("Error fetching workout plan:", error);
    res.status(500).json({ error: error.message });
  }
});


// Export the router to be used in index.ts
export default router;
