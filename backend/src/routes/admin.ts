// backend/src/routes/admin.ts

import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import { authenticateToken } from "../middleware/authMiddleware";

const adminRouter = Router();

/**
 * POST /api/admin/login
 * Admin login: verifies credentials stored in .env and returns an admin token.
 * @access Public
 */
adminRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Include id: 0 to indicate admin
    const token = jwt.sign({ id: 0, isAdmin: true, email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: "Invalid admin credentials" });
});

/**
 * Middleware to protect admin endpoints.
 * Verifies the token and checks for the isAdmin flag.
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
    // Query users and count unread messages for each user (messages from the user to admin)
    const result = await pool.query(
      `SELECT u.*, 
         (SELECT COUNT(*) FROM messages m 
          WHERE m.sender_id = u.id AND m.receiver_id = 0 AND m.is_read = false) AS unread_count
       FROM users u
       ORDER BY u.id ASC`
    );
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

/**
 * PUT /api/admin/messages/read/:userId
 * Marks all unread messages from a specific user (sender_id = userId) to admin (receiver_id = 0) as read.
 * @access Private (admin only)
 */
adminRouter.put('/messages/read/:userId', adminAuthMiddleware, async (req, res) => {
  const userId = req.params.userId;
  try {
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = 0 AND is_read = false`,
      [userId]
    );
    res.json({ message: "Messages marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default adminRouter;
