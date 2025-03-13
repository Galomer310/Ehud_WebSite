// backend/src/routes/plans.ts

import { Router } from "express";
import pool from "../db";
import { authenticateToken } from "../middleware/authMiddleware";
import { IWorkoutPlanDay, IWorkoutExercise } from "../types";

const plansRouter = Router();

/**
 * POST /api/admin/plans/:userId
 * Create or replace the workout plan for a specific user, in a structured manner:
 * - Clear old day rows for that user
 * - Insert each day (with day_number, feedback/done if provided)
 * - Insert each exercise for each day
 * @access Private (admin only)
 */
plansRouter.post("/:userId", authenticateToken, async (req, res) => {
  try {
    const admin = (req as any).user;
    if (!admin.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const userId = parseInt(req.params.userId, 10);
    const days: IWorkoutPlanDay[] = req.body.days || [];

    // Remove existing days (and their exercises, due to ON DELETE CASCADE if you choose) for this user:
    await pool.query("DELETE FROM workout_plan_days WHERE user_id = $1", [userId]);

    for (const dayObj of days) {
      const { day_number, feedback, done, exercises } = dayObj;
      // Insert day
      const dayResult = await pool.query(
        `INSERT INTO workout_plan_days (user_id, day_number, feedback, done)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, day_number, feedback || "", done || false]
      );
      const planDayId = dayResult.rows[0].id;

      // Insert exercises for that day
      if (exercises && exercises.length > 0) {
        for (const ex of exercises) {
          await pool.query(
            `INSERT INTO workout_exercises
              (plan_day_id, drill_name, weight, reps, sets, rest_time)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              planDayId,
              ex.drill_name,
              ex.weight,
              ex.reps,
              ex.sets,
              ex.rest_time,
            ]
          );
        }
      }
    }

    res.json({ message: "Plan saved successfully" });
  } catch (error: any) {
    console.error("Error creating/updating plan:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/plans/:userId
 * Fetch the workout plan for a specific user in a structured manner
 * (Day records + associated Exercises).
 * @access Private (admin only)
 */
plansRouter.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const admin = (req as any).user;
    if (!admin.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const userId = parseInt(req.params.userId, 10);

    // 1) Fetch the day rows
    const dayRows = await pool.query(
      `SELECT * FROM workout_plan_days
       WHERE user_id = $1
       ORDER BY day_number ASC`,
      [userId]
    );
    // 2) Fetch the exercises joined on plan_day_id
    const exerciseRows = await pool.query(
      `SELECT e.*,
              d.day_number
       FROM workout_exercises e
       JOIN workout_plan_days d
         ON e.plan_day_id = d.id
       WHERE d.user_id = $1
       ORDER BY d.day_number ASC`,
      [userId]
    );

    // Build a structured result
    const daysMap: Record<number, IWorkoutPlanDay> = {};

    dayRows.rows.forEach((row) => {
      daysMap[row.day_number] = {
        id: row.id,
        user_id: row.user_id,
        day_number: row.day_number,
        feedback: row.feedback,
        done: row.done,
        created_at: row.created_at,
        updated_at: row.updated_at,
        exercises: [],
      };
    });

    exerciseRows.rows.forEach((ex) => {
      if (!daysMap[ex.day_number]) return; // should not happen if data is consistent
      daysMap[ex.day_number].exercises?.push({
        id: ex.id,
        plan_day_id: ex.plan_day_id,
        drill_name: ex.drill_name,
        weight: ex.weight,
        reps: ex.reps,
        sets: ex.sets,
        rest_time: ex.rest_time,
        created_at: ex.created_at,
        updated_at: ex.updated_at,
      });
    });

    // Convert to array
    const days = Object.values(daysMap);

    res.json({ days });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default plansRouter;
