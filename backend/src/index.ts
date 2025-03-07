// Import necessary libraries and modules
import express from 'express';           // Import Express framework
import cors from 'cors';                 // Import CORS middleware
import dotenv from 'dotenv';             // Import dotenv to load environment variables
import authRoutes from './routes/auth';  // Import authentication routes

dotenv.config();  // Load environment variables from .env file

const app = express();                   // Create an Express application
const port = process.env.PORT || 5000;     // Set port from environment or default to 5000

app.use(cors());                         // Enable Cross-Origin Resource Sharing
app.use(express.json());                 // Parse JSON request bodies

// Define a basic route for the root path
app.get('/', (req, res) => {
  res.send('Welcome to the Ehud Fitness Program API!');
});

// Mount authentication routes under '/api/auth'
app.use('/api/auth', authRoutes);

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
