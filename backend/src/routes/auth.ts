import { Router } from "express";
import pool from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

/* ───────  Nodemailer  ─────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*─────────────────────────────────────────
  POST /api/auth/register
─────────────────────────────────────────*/
router.post("/register", async (req, res) => {
  /* normalise & de-structure input */
  const safeEmail = (req.body.email || "").trim().toLowerCase();
  const {
    password,
    height,
    weight,
    age,
    occupation,
    exercise_frequency,
    sex,
    medical_conditions,
  } = req.body;

  try {
    /* 1. duplicate e-mail check (case-insensitive) */
    const existing = await pool.query(
      "SELECT 1 FROM users WHERE LOWER(email)=LOWER($1)",
      [safeEmail]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "Your email is already registered. Please login." });
    }

    /* 2. bcrypt the password */
    const hashedPwd = await bcrypt.hash(password, 10);

    /* 3. verification token */
    const verificationToken = crypto.randomBytes(32).toString("hex");

    /* 4. insert user */
    await pool.query(
      `INSERT INTO users
         (email, password, height, weight, age, occupation,
          exercise_frequency, sex, medical_conditions, verification_token)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        safeEmail,
        hashedPwd,
        height || null,
        weight || null,
        age || null,
        occupation || "",
        exercise_frequency || null,
        sex || "",
        medical_conditions || "",
        verificationToken,
      ]
    );

    /* 5. send verification e-mail */
    const link = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: `"Ehud Fitness" <${process.env.EMAIL_USER}>`,
      to: safeEmail,
      subject: "Please verify your email",
      html: `<p>Thank you for registering at Ehud Fitness!</p>
             <p>Please click <a href="${link}">this link</a> to verify your email and activate your account.</p>`,
    });

    res
      .status(201)
      .json({ message: "Registration successful! Please verify your email." });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*─────────────────────────────────────────
  GET /api/auth/verify-email
─────────────────────────────────────────*/
router.get("/verify-email", async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).send("Verification token is missing.");

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE verification_token=$1",
      [token]
    );
    const user = result.rows[0];
    if (!user) return res.status(400).send("Invalid verification token.");

    await pool.query(
      "UPDATE users SET is_verified=true, verification_token=NULL WHERE id=$1",
      [user.id]
    );
    res.redirect("http://localhost:3000/personal");
  } catch (err: any) {
    console.error(err);
    res.status(500).send("Internal server error.");
  }
});

/*─────────────────────────────────────────
  POST /api/auth/login
─────────────────────────────────────────*/
router.post("/login", async (req, res) => {
  const safeEmail = (req.body.email || "").trim().toLowerCase();
  const { password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email)=LOWER($1)",
      [safeEmail]
    );

    /* guard A – e-mail not found */
    if (result.rowCount === 0) {
      console.log("[LOGIN] guard-A email not found");
      return res
        .status(400)
        .json({ error: "Email invalid. Please register first." });
    }

    const user = result.rows[0];

    /* guard B – wrong password */
    const okPwd = await bcrypt.compare(password, user.password);
    if (!okPwd) {
      console.log("[LOGIN] guard-B password mismatch");
      return res
        .status(400)
        .json({ error: "Incorrect password. Please try again." });
    }

    /* guard C – not verified */
    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "Email not verified. Please check your email." });
    }

    /* success → sign JWT */
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    res.json({ token, user });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*─────────────────────────────────────────
  POST /api/auth/subscribe
─────────────────────────────────────────*/
router.post("/subscribe", authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  const { subscriptionPlan, subscriptionPrice, trainingCategory } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
         SET subscription_plan=$1,
             subscription_price=$2,
             training_category=$3
       WHERE id=$4
       RETURNING *`,
      [subscriptionPlan, subscriptionPrice, trainingCategory, userId]
    );

    // notify admin by e-mail (optional)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await transporter.sendMail({
        from: `"Ehud Fitness" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: "New Subscription Chosen",
        html: `<p>User <strong>${result.rows[0].email}</strong> chose a new plan.</p>
               <p><b>Category:</b> ${trainingCategory}</p>
               <p><b>Plan:</b> ${subscriptionPlan}</p>
               <p><b>Price:</b> ${subscriptionPrice}</p>`,
      });
    }

    res.json({ message: "Subscription plan updated", user: result.rows[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*─────────────────────────────────────────
  GET /api/auth/personal (protected)
─────────────────────────────────────────*/
router.get("/personal", authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [
      userId,
    ]);
    const user = result.rows[0];
    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "Email not verified. Please check your email." });
    }
    res.json({ user });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
