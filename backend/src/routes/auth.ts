import { Router } from 'express';     // Import Router from Express
import pool from '../db';             // Import the database pool
import bcrypt from 'bcrypt';          // Import bcrypt for password hashing
import jwt from 'jsonwebtoken';       // Import jsonwebtoken for JWT handling
import { authenticateToken } from '../middleware/authMiddleware';  // Import authentication middleware

const router = Router();  // Create a new router instance

// Registration route
router.post('/register', async (req, res) => {
  // Destructure required fields from the request body
  const { email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions } = req.body;
  try {
    const saltRounds = 10;  // Define number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);  // Hash the password

    // Insert a new user into the database with the provided details and hashed password
    const result = await pool.query(
      `INSERT INTO users (email, password, height, weight, age, occupation, exercise_frequency, sex, medical_conditions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [email, hashedPassword, height, weight, age, occupation, exercise_frequency, sex, medical_conditions]
    );

    // Respond with the newly created user record
    res.status(201).json({ user: result.rows[0] });
  } catch (error: any) {
    console.error(error);  // Log any errors to the console
    res.status(500).json({ error: error.message });  // Return error message to the client
  }
});

// Login route
router.post('/login', async (req, res) => {
  // Destructure email and password from the request body
  const { email, password } = req.body;
  try {
    // Query the database for a user with the provided email
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    // If user not found, return an error
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare provided password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token with user id and email as payload; token expires in 1 hour
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, {
      expiresIn: '1h'
    });

    // Respond with the token and user information
    res.json({ token, user });
  } catch (error: any) {
    console.error(error);  // Log errors for debugging
    res.status(500).json({ error: error.message });
  }
});

// Protected route for accessing the personal area
router.get('/personal', authenticateToken, async (req, res) => {
  // Retrieve user id from the request (set by authentication middleware)
  const userId = (req as any).user.id;
  try {
    // Query the database for the user data using the retrieved user id
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    // Respond with the user data
    res.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error(error);  // Log errors if any occur
    res.status(500).json({ error: error.message });
  }
});

export default router;  // Export the router to be used in index.ts
