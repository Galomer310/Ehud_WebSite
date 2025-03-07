// backend/src/routes/admin.ts

// Import required modules
import { Router } from "express";          // Router for creating endpoints
import jwt from "jsonwebtoken";            // JWT for generating admin tokens
import pool from "../db";                  // PostgreSQL connection pool for database operations
import { authenticateToken } from "../middleware/authMiddleware"; // (Optional) if you want to protect other admin endpoints

const adminRouter = Router(); // Create a new router instance for admin routes

/**
 * POST /api/admin/login
 * Admin login: verifies the credentials stored in the environment variables.
 * Returns an admin token with an "isAdmin" flag.
 * This endpoint is public.
 */
adminRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Compare the provided credentials with those stored in .env
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Generate a JWT token that includes an "isAdmin" flag
    const token = jwt.sign({ isAdmin: true, email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return res.json({ token });
  }
  // If credentials do not match, return an error
  return res.status(401).json({ error: "Invalid admin credentials" });
});

/**
 * Middleware to protect admin endpoints.
 * Verifies the token and ensures the "isAdmin" flag is present.
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
 * Protected route: Only accessible to admins.
 */
adminRouter.get('/dashboard', adminAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    res.json({ users: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default adminRouter;
