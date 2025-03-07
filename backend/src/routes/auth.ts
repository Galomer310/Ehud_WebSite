// backend/src/routes/auth.ts

// Import required modules for our endpoints
import { Router } from 'express';               // Express Router for endpoints
import pool from '../db';                         // PostgreSQL connection pool
import bcrypt from 'bcrypt';                      // bcrypt for password hashing
import jwt from 'jsonwebtoken';                   // JWT for token generation
import { authenticateToken } from '../middleware/authMiddleware'; // Middleware to protect routes
import nodemailer from 'nodemailer';              // Nodemailer for sending emails
import crypto from 'crypto';                      // crypto for generating random tokens

const router = Router(); // Create a new router instance

// Configure the Nodemailer transporter for Gmail using app-specific password
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
    // Check if a user with this email already exists
    const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if ((existingUser.rowCount ?? 0) > 0) {
      // If user exists, send a 400 error response
      return res.status(400).json({ error: "Your email is already registered. Please login." });
    }
    
    // Hash the password with bcrypt using 10 salt rounds
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

    // Construct a verification URL containing the generated token
    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

    // Send a verification email to the user
    await transporter.sendMail({
      from: '"Ehud Fitness" <no-reply@ehudfitness.com>', // Sender address
      to: email,                                          // Recipient address
      subject: "Please verify your email",              // Email subject
      html: `<p>Thank you for registering at Ehud Fitness!</p>
             <p>Please click <a href="${verificationUrl}">this link</a> to verify your email and activate your account.</p>`
    });

    // Respond with a success message prompting the user to verify their email
    res.status(201).json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (error: any) {
    console.error(error); // Log error for debugging
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/verify-email
 * Verifies the user's email using the token provided in the URL.
 */
router.get('/verify-email', async (req, res) => {
  // Retrieve token from query parameters
  const token = req.query.token as string;
  if (!token) return res.status(400).send("Verification token is missing.");
  
  try {
    // Find user by verification token
    const result = await pool.query(`SELECT * FROM users WHERE verification_token = $1`, [token]);
    const user = result.rows[0];
    if (!user) return res.status(400).send("Invalid verification token.");

    // Update the user record to mark the email as verified and remove the token
    await pool.query(
      `UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1`,
      [user.id]
    );
    // Redirect user to the Personal Area page after verification
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
  // Extract email and password from request body
  const { email, password } = req.body;
  try {
    // Query the database for the user with the provided email
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rowCount === 0) 
      return res.status(400).json({ error: "Email invalid. Please register first." });

    const user = result.rows[0];
    // Compare provided password with hashed password in the database
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) 
      return res.status(400).json({ error: "Incorrect password. Please try again." });

    // Check if the user's email has been verified
    if (!user.is_verified) 
      return res.status(403).json({ error: "Email not verified. Please check your email." });

    // Generate a JWT token (expires in 1 hour)
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    // Respond with token and user data
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
  // Get authenticated user's ID
  const userId = (req as any).user.id;
  // Extract subscription details from the request body
  const { subscriptionPlan, subscriptionPrice, trainingCategory } = req.body;
  try {
    // Update the user's record with the subscription details
    const result = await pool.query(
      `UPDATE users 
       SET subscription_plan = $1, subscription_price = $2, training_category = $3 
       WHERE id = $4 RETURNING *`,
      [subscriptionPlan, subscriptionPrice, trainingCategory, userId]
    );

    // Send an email notification to the admin regarding the subscription update
    const adminEmail = process.env.ADMIN_EMAIL; // Must be set in your .env
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

    // Respond with success message and updated user data
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
  // Get authenticated user's ID
  const userId = (req as any).user.id;
  try {
    // Query the user's data from the database
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const user = result.rows[0];
    // If user isn't verified, respond with a 403 error
    if (!user.is_verified) return res.status(403).json({ error: "Email not verified. Please check your email." });
    // Respond with the user data
    res.json({ user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Export the router to be used in the main server file (index.ts)
export default router;
