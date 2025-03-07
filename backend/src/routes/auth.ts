// src/routes/auth.ts

// Import necessary modules and libraries
import { Router } from 'express';               // For creating API endpoints
import pool from '../db';                         // PostgreSQL connection pool
import bcrypt from 'bcrypt';                      // For hashing passwords
import jwt from 'jsonwebtoken';                   // For generating JWT tokens
import { authenticateToken } from '../middleware/authMiddleware'; // Middleware to protect routes
import nodemailer from 'nodemailer';              // For sending emails
import crypto from 'crypto';                      // For generating a secure verification token

const router = Router(); // Create a new router instance

// Configure the Nodemailer transporter for Gmail.
// Here, we use the 'service' option to let Nodemailer use Gmail's default SMTP settings.
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail's SMTP service
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address (e.g., galomer6708@gmail.com)
    pass: process.env.EMAIL_PASS  // Your Gmail App Password (generated in your Google account)
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, generate a verification token, and send a verification email.
 * @access  Public
 */
router.post('/register', async (req, res) => {
  // Destructure registration fields from the request body
  const { email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions } = req.body;
  try {
    // Check if the email already exists in the database
    const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      // If the email is already registered, return an error message
      return res.status(400).json({ error: "Your email is already registered. Please login." });
    }

    // Hash the provided password using bcrypt with 10 salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a unique verification token using crypto (32 random bytes converted to hex)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert the new user into the database along with the verification token.
    // Note: The 'is_verified' field should default to false in your schema.
    const result = await pool.query(
      `INSERT INTO users (email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [email, hashedPassword, height, weight, age, occupation, exercise_frequency, sex, medical_conditions, verificationToken]
    );

    // Construct the verification URL including the token as a query parameter.
    // Adjust the URL/port to match your deployment or development settings.
    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

    // Send the verification email using the Nodemailer transporter.
    await transporter.sendMail({
      from: '"Ehud Fitness" <no-reply@ehudfitness.com>', // Sender info
      to: email,                                          // Recipient's email address
      subject: "Please verify your email",              // Email subject
      html: `<p>Thank you for registering at Ehud Fitness!</p>
             <p>Please click <a href="${verificationUrl}">this link</a> to verify your email and activate your account.</p>` // HTML email content
    });

    // Respond with a message indicating registration was successful and email verification is required.
    res.status(201).json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (error: any) {
    // Log the error and respond with an internal server error message.
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify the user's email using the provided token.
 * @access  Public
 */
router.get('/verify-email', async (req, res) => {
  // Retrieve the verification token from the query parameters.
  const token = req.query.token as string;
  if (!token) {
    // If no token is provided, respond with a 400 error.
    return res.status(400).send("Verification token is missing.");
  }
  
  try {
    // Find the user with the matching verification token in the database.
    const result = await pool.query(`SELECT * FROM users WHERE verification_token = $1`, [token]);
    const user = result.rows[0];

    if (!user) {
      // If no user is found, the token is invalid.
      return res.status(400).send("Invalid verification token.");
    }

    // Update the user's record to mark the email as verified and remove the token.
    await pool.query(
      `UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1`,
      [user.id]
    );

    // Redirect the user to the frontend Personal Area after successful verification.
    res.redirect('http://localhost:3000/personal'); // Adjust the URL as necessary.
  } catch (error: any) {
    // Log the error and respond with an internal server error message.
    console.error(error);
    res.status(500).send("Internal server error.");
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and return a JWT token.
 * @access  Public
 */
router.post('/login', async (req, res) => {
  // Destructure email and password from the login request body.
  const { email, password } = req.body;
  try {
    // Query the database for a user with the provided email.
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    
    // If no user is found, return an error asking the user to register.
    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Email invalid. Please register first." });
    }

    const user = result.rows[0];
    
    // Compare the provided password with the stored hashed password.
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // If the password doesn't match, return an error.
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    // Check if the user's email is verified before allowing login.
    if (!user.is_verified) {
      return res.status(403).json({ error: "Email not verified. Please check your email." });
    }

    // Generate a JWT token that expires in 1 hour.
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, {
      expiresIn: '1h'
    });

    // Respond with the token and user data.
    res.json({ token, user });
  } catch (error: any) {
    // Log the error and respond with an internal server error message.
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/auth/personal
 * @desc    Protected route to access the Personal Area; only accessible to verified users.
 * @access  Private
 */
router.get('/personal', authenticateToken, async (req, res) => {
  // Retrieve the user ID from the request (set by the authentication middleware).
  const userId = (req as any).user.id;
  try {
    // Query the database for the user's details.
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const user = result.rows[0];

    // Check if the user's email is verified; if not, return an error.
    if (!user.is_verified) {
      return res.status(403).json({ error: "Email not verified. Please check your email." });
    }

    // Respond with the user's details.
    res.json({ user });
  } catch (error: any) {
    // Log the error and return an internal server error message.
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Export the router so that it can be used in your main server file (index.ts)
export default router;
