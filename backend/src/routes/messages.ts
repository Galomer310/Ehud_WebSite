import { Router } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/authMiddleware';
import { sendEmailNotification } from '../helpers/emailNotification';

const messagesRouter = Router();

/**
 * GET /api/messages
 * Protected route to fetch messages.
 * - For admin: returns all messages.
 * - For regular users: returns only messages exchanged with admin.
 */
messagesRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.isAdmin) {
      const result = await pool.query(
        `SELECT m.*, 
                CASE WHEN m.sender_id = 0 THEN 'Admin' ELSE u.email END as sender_email
         FROM messages m 
         LEFT JOIN users u ON m.sender_id = u.id 
         ORDER BY m.created_at DESC`
      );
      return res.json({ messages: result.rows });
    } else {
      const userId = user.id;
      const result = await pool.query(
        `SELECT m.*, 
                CASE WHEN m.sender_id = 0 THEN 'Admin' ELSE u.email END as sender_email
         FROM messages m 
         LEFT JOIN users u ON m.sender_id = u.id 
         WHERE ((m.sender_id = 0 AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = 0))
         ORDER BY m.created_at DESC`,
         [userId]
      );
      return res.json({ messages: result.rows });
    }
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/messages/conversation/:userId
 * Protected route for admin to fetch the conversation between admin and a specific user.
 */
messagesRouter.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    const targetUserId = req.params.userId;
    const result = await pool.query(
      `SELECT m.*, 
              CASE WHEN m.sender_id = 0 THEN 'Admin' ELSE u.email END as sender_email
       FROM messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE ((m.sender_id = 0 AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = 0))
       ORDER BY m.created_at DESC`,
      [targetUserId]
    );
    res.json({ messages: result.rows });
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/messages/new
 * For regular users: fetch unread admin messages.
 */
messagesRouter.get('/new', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      `SELECT m.*, 
              CASE WHEN m.sender_id = 0 THEN 'Admin' ELSE u.email END as sender_email
       FROM messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.receiver_id = $1 AND m.sender_id = 0 AND m.is_read = false
       ORDER BY m.created_at DESC`,
      [userId]
    );
    res.json({ messages: result.rows });
  } catch (error: any) {
    console.error("Error fetching new messages:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/messages/:id/read
 * Marks a specific message as read.
 */
messagesRouter.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    await pool.query(`UPDATE messages SET is_read = true WHERE id = $1`, [messageId]);
    res.json({ message: "Message marked as read." });
  } catch (error: any) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages
 * Protected route to send a message.
 * For regular users, the receiver is always admin (receiver_id = 0).
 * For admin, the recipient is fetched dynamically from the users table.
 */
messagesRouter.post('/', authenticateToken, async (req, res) => {
  try {
    let senderId = (req as any).user.id;
    const user = (req as any).user;
    if (user.isAdmin) {
      senderId = 0;
    }
    const { receiver_id, message } = req.body;
    if ((receiver_id === undefined || receiver_id === null) || !message) {
      return res.status(400).json({ error: "Receiver ID and message are required." });
    }
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiver_id, message]
    );

    // Determine the recipient email dynamically
    let recipientEmail = "";
    if (user.isAdmin) {
      // For admin sending a message to a user, fetch the user's email from the database
      const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [receiver_id]);
      if (userResult.rowCount && userResult.rowCount > 0) {
        recipientEmail = userResult.rows[0].email;
      }
    } else {
      // For a regular user sending a message, the recipient is the admin
      recipientEmail = process.env.ADMIN_EMAIL as string;
    }

    // Send an email notification if recipientEmail is set
    if (recipientEmail) {
      const subject = "New Message from Ehud Fitness Platform";
      const html = `<p>You have received a new message: </p><p>${message}</p>`;
      await sendEmailNotification(recipientEmail, subject, html);
    }

    res.status(201).json({ message: "Message sent successfully", data: result.rows[0] });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

export default messagesRouter;
