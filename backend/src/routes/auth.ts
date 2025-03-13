// backend/src/routes/auth.ts

import { Router } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/authMiddleware';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * POST /api/auth/register
 * Registers a new user, generates a verification token, and sends a verification email.
 */
router.post('/register', async (req, res) => {
  const { email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions } = req.body;
  try {
    const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (existingUser.rowCount ?? 0 > 0) {
      return res.status(400).json({ error: "Your email is already registered. Please login." });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO users (email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [email, hashedPassword, height, weight, age, occupation, exercise_frequency, sex, medical_conditions, verificationToken]
    );

    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

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
    const adminEmail = process.env.ADMIN_EMAIL;
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
 * GET /api/auth/plan-structured
 * Protected route for a user to fetch their days + exercises from the DB.
 */
router.get('/plan-structured', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // 1) Fetch day rows
    const dayRows = await pool.query(
      `SELECT * FROM workout_plan_days
       WHERE user_id = $1
       ORDER BY day_number ASC`,
      [userId]
    );

    // 2) Fetch exercises for those days
    const exerciseRows = await pool.query(
      `SELECT e.*, d.day_number
       FROM workout_exercises e
       JOIN workout_plan_days d ON e.plan_day_id = d.id
       WHERE d.user_id = $1
       ORDER BY d.day_number ASC`,
      [userId]
    );

    // Build a structured result
    const daysMap: Record<number, any> = {};
    dayRows.rows.forEach((row) => {
      daysMap[row.day_number] = {
        id: row.id,
        user_id: row.user_id,
        day_number: row.day_number,
        feedback: row.feedback,
        done: row.done,
        created_at: row.created_at,
        updated_at: row.updated_at,
        exercises: []
      };
    });

    exerciseRows.rows.forEach((ex) => {
      if (!daysMap[ex.day_number]) return;
      daysMap[ex.day_number].exercises.push({
        id: ex.id,
        plan_day_id: ex.plan_day_id,
        drill_name: ex.drill_name,
        weight: ex.weight,
        reps: ex.reps,
        sets: ex.sets,
        rest_time: ex.rest_time,
        created_at: ex.created_at,
        updated_at: ex.updated_at
      });
    });

    const days = Object.values(daysMap).sort((a: any, b: any) => a.day_number - b.day_number);
    res.json({ days });
  } catch (error: any) {
    console.error("Error fetching structured plan:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/day/:dayId/feedback
 * Protected route for a user to update feedback (and done) for a specific day.
 */
router.put('/day/:dayId/feedback', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const dayId = parseInt(req.params.dayId, 10);
    const { feedback } = req.body;

    // Ensure the day belongs to this user
    const check = await pool.query(
      `SELECT * FROM workout_plan_days
       WHERE id = $1 AND user_id = $2`,
      [dayId, userId]
    );
    if (check.rowCount === 0) {
      return res.status(403).json({ error: "No access to this day" });
    }

    // Mark day as done if feedback is non-empty
    const isDone = feedback && feedback.trim().length > 0;

    await pool.query(
      `UPDATE workout_plan_days
       SET feedback = $1,
           done = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [feedback, isDone, dayId]
    );

    res.json({ message: "Feedback updated successfully" });
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/plan
 * (Optional: old route if you want to keep it)
 * 
 * This was your original JSON-based plan route. You can remove it if not needed anymore.
 */

export default router;
