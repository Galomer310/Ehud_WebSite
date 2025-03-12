import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

// Define an interface for an exercise including "sets"
interface Exercise {
  drillName: string;
  weight: string;
  reps: string;
  sets: string;
  restTime: string;
}

// Define the workout plan type: keys are day numbers, values are arrays of exercises
interface WorkoutPlan {
  [day: number]: Exercise[];
}

const PlansConstructor: React.FC = () => {
  const { userId } = useParams<{ userId: string }>(); // Target user ID from URL
  const token =
    useSelector((state: RootState) => state.auth.token) ||
    localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({});
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [newExercise, setNewExercise] = useState<Exercise>({
    drillName: "",
    weight: "",
    reps: "",
    sets: "",
    restTime: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Fetch existing plan for the user (if exists)
  useEffect(() => {
    if (userId && token) {
      axios
        .get(`http://localhost:5000/api/admin/plans/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          // Assume plan is stored as { dayPlans: { "1": [...], "2": [...], ... } }
          setWorkoutPlan(response.data.plan.dayPlans || {});
        })
        .catch((error) => {
          console.error("Error fetching workout plan:", error);
        });
    }
  }, [userId, token]);

  // Handler to add a new exercise row
  const addExercise = () => {
    if (!newExercise.drillName) {
      alert("Please enter a drill name");
      return;
    }
    setWorkoutPlan((prevPlan) => {
      const dayExercises = prevPlan[selectedDay] || [];
      return { ...prevPlan, [selectedDay]: [...dayExercises, newExercise] };
    });
    setNewExercise({
      drillName: "",
      weight: "",
      reps: "",
      sets: "",
      restTime: "",
    });
  };

  // Handler to begin editing a specific exercise row
  const startEditing = (index: number, exercise: Exercise) => {
    setEditingIndex(index);
    setEditingExercise(exercise);
  };

  // Handler to save edited exercise row
  const saveEditedExercise = () => {
    if (editingIndex === null || editingExercise === null) return;
    setWorkoutPlan((prevPlan) => {
      const dayExercises = prevPlan[selectedDay] || [];
      dayExercises[editingIndex] = editingExercise;
      return { ...prevPlan, [selectedDay]: dayExercises };
    });
    setEditingIndex(null);
    setEditingExercise(null);
  };

  // Handler to save the entire plan for the user
  const savePlan = async () => {
    if (!userId || !token) return;
    const planData = { dayPlans: workoutPlan };
    try {
      await axios.post(
        `http://localhost:5000/api/admin/plans/${userId}`,
        { plan: planData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Plan saved successfully");
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Error saving workout plan:", error);
      alert("Failed to save workout plan");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Workout Plan Constructor for User {userId}</h1>
      <div>
        <label>
          Select Day:{" "}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 90 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                Day {day}
              </option>
            ))}
          </select>
        </label>
      </div>
      <h2>Day {selectedDay} Exercises</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Drill Name
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Weight</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Reps</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Sets</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Rest Time
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {(workoutPlan[selectedDay] || []).map((exercise, index) => (
            <tr key={index}>
              {editingIndex === index && editingExercise ? (
                <>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <input
                      type="text"
                      value={editingExercise.drillName}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          drillName: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <input
                      type="text"
                      value={editingExercise.weight}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          weight: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <input
                      type="text"
                      value={editingExercise.reps}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          reps: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <input
                      type="text"
                      value={editingExercise.sets}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          sets: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <input
                      type="text"
                      value={editingExercise.restTime}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          restTime: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={saveEditedExercise}
                      style={{ padding: "0.5rem", cursor: "pointer" }}
                    >
                      Save
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {exercise.drillName}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {exercise.weight}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {exercise.reps}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {exercise.sets}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {exercise.restTime}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button
                      onClick={() => startEditing(index, exercise)}
                      style={{ padding: "0.5rem", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {/* Row to add a new exercise */}
          <tr>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              <input
                type="text"
                placeholder="Drill Name"
                value={newExercise.drillName}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, drillName: e.target.value })
                }
              />
            </td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              <input
                type="text"
                placeholder="Weight"
                value={newExercise.weight}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, weight: e.target.value })
                }
              />
            </td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              <input
                type="text"
                placeholder="Reps"
                value={newExercise.reps}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, reps: e.target.value })
                }
              />
            </td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              <input
                type="text"
                placeholder="Sets"
                value={newExercise.sets}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, sets: e.target.value })
                }
              />
            </td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              <input
                type="text"
                placeholder="Rest Time"
                value={newExercise.restTime}
                onChange={(e) =>
                  setNewExercise({ ...newExercise, restTime: e.target.value })
                }
              />
            </td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              <button
                onClick={addExercise}
                style={{ padding: "0.5rem", cursor: "pointer" }}
              >
                Add Exercise
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <br />
      <button
        onClick={savePlan}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
      >
        Save Plan
      </button>
    </div>
  );
};

export default PlansConstructor;
