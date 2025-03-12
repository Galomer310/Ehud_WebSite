// backend/src/routes/plans.ts

import { Router } from "express";
import pool from "../db";
import { authenticateToken } from "../middleware/authMiddleware";

const plansRouter = Router();

/**
 * GET /api/admin/plans/:userId
 * Fetch the workout plan for a specific user.
 * Accessible only to admin.
 * If no plan exists, returns an empty object.
 */
plansRouter.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    const userId = req.params.userId;
    const result = await pool.query("SELECT * FROM workout_plans WHERE user_id = $1", [userId]);
    if (result.rowCount ?? 0 > 0) {
      res.json({ plan: result.rows[0].plan });
    } else {
      res.json({ plan: {} });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/plans/:userId
 * Create or update the workout plan for a specific user.
 * Expects the plan as JSON in the body.
 * Accessible only to admin.
 */
plansRouter.post("/:userId", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    const userId = req.params.userId;
    const planData = req.body.plan; // Expected to be a JSON object, e.g., { dayPlans: { "1": [ ... ], "2": [ ... ] } }
    const existing = await pool.query("SELECT * FROM workout_plans WHERE user_id = $1", [userId]);
    if (existing.rowCount ?? 0 > 0) {
      const result = await pool.query(
        "UPDATE workout_plans SET plan = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *",
        [planData, userId]
      );
      res.json({ message: "Plan updated successfully", plan: result.rows[0].plan });
    } else {
      const result = await pool.query(
        "INSERT INTO workout_plans (user_id, plan) VALUES ($1, $2) RETURNING *",
        [userId, planData]
      );
      res.json({ message: "Plan created successfully", plan: result.rows[0].plan });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default plansRouter;
