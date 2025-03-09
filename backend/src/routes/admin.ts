// backend/src/routes/admin.ts

import { Router } from "express";           // Router for creating endpoints
import jwt from "jsonwebtoken";             // JWT for generating tokens
import pool from "../db";                   // PostgreSQL connection pool
import { authenticateToken } from "../middleware/authMiddleware"; // (Optional) Protect endpoints

const adminRouter = Router(); // Create admin router

/**
 * POST /api/admin/login
 * Admin login: verifies credentials from .env and returns an admin token.
 * @access Public
 */
adminRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Check if provided credentials match the admin credentials from .env
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Create a JWT token with an "isAdmin" flag
    const token = jwt.sign({ isAdmin: true, email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: "Invalid admin credentials" });
});

/**
 * Middleware to protect admin endpoints.
 * Verifies token and ensures the "isAdmin" flag is present.
 */
const adminAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
    if (err || !decoded.isAdmin) return res.sendStatus(403);
    req.admin = decoded;
    next();
  });
};

/**
 * GET /api/admin/dashboard
 * Returns all registered users with their details and subscription info.
 * @access Private (admin only)
 */
adminRouter.get('/dashboard', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    res.json({ users: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Deletes a user by their ID.
 * @access Private (admin only)
 */
adminRouter.delete('/users/:id', adminAuthMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id/subscribe
 * Updates a user's subscription plan details.
 * @access Private (admin only)
 */
adminRouter.put('/users/:id/subscribe', adminAuthMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { subscriptionPlan, subscriptionPrice, trainingCategory } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET subscription_plan = $1, subscription_price = $2, training_category = $3 
       WHERE id = $4 RETURNING *`,
      [subscriptionPlan, subscriptionPrice, trainingCategory, userId]
    );
    res.json({ message: "Subscription updated successfully", user: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default adminRouter;
