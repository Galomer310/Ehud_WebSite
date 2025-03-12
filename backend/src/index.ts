// backend/src/index.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import messagesRouter from "./routes/messages";
import plansRouter from "./routes/plans"; // Import the plans router

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Ehud Fitness Program API!");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messagesRouter);
app.use("/api/admin/plans", plansRouter); // Mount the plans router under /api/admin/plans

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
