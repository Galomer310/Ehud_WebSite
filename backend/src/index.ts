// backend/src/index.ts

import express from "express";       // Express framework for server creation
import cors from "cors";             // CORS middleware to allow cross-origin requests
import dotenv from "dotenv";         // dotenv to load environment variables
import authRoutes from "./routes/auth";  // Import user routes (registration, login, etc.)
import adminRoutes from "./routes/admin"; // Import admin routes

dotenv.config(); // Load environment variables from .env file

const app = express();                 // Create the Express app
const port = process.env.PORT || 5000;   // Set the port from environment variables or default to 5000

app.use(cors());                       // Enable CORS for all routes
app.use(express.json());               // Enable JSON body parsing

// Basic route for testing server
app.get("/", (req, res) => {
  res.send("Welcome to the Ehud Fitness Program API!");
});

// Mount user routes under /api/auth
app.use("/api/auth", authRoutes);
// Mount admin routes under /api/admin
app.use("/api/admin", adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
