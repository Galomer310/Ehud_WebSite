// backend/src/routes/messages.ts

import { Router } from 'express';  // Import Router to create endpoints
import pool from '../db';            // Import the PostgreSQL connection pool
import { authenticateToken } from '../middleware/authMiddleware'; // Protect endpoints

const messagesRouter = Router();

/**
 * GET /api/messages
 * Protected route to fetch messages for the authenticated user.
 * Retrieves messages where the receiver_id equals the user's id.
 * If sender_id is 0, it displays "Admin" as the sender_email.
 */
messagesRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id; // Get authenticated user's ID
    // Use LEFT JOIN so that if sender_id is 0 (admin), we can substitute a label
    const result = await pool.query(
      `SELECT m.*, 
              CASE WHEN m.sender_id = 0 THEN 'Admin' ELSE u.email END as sender_email
       FROM messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.receiver_id = $1 
       ORDER BY m.created_at DESC`,
      [userId]
    );
    res.json({ messages: result.rows });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages
 * Protected route to send a message from the authenticated user to a specified receiver.
 * If the sender is an admin, sets sender_id to 0.
 * Expects the request body to include receiver_id and message.
 */
messagesRouter.post('/', authenticateToken, async (req, res) => {
  try {
    // Get sender ID from the token
    let senderId = (req as any).user.id;
    // If the token indicates an admin, set senderId to 0
    if ((req as any).user.isAdmin) {
      senderId = 0;
    }
    const { receiver_id, message } = req.body;
    if (!receiver_id || !message) {
      return res.status(400).json({ error: "Receiver ID and message are required." });
    }
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiver_id, message]
    );
    res.status(201).json({ message: "Message sent successfully", data: result.rows[0] });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

export default messagesRouter;
