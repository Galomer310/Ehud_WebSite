// frontend/src/components/PlansConstructor.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { IWorkoutPlanDay, IWorkoutExercise } from "../types";

const PlansConstructor: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const token =
    useSelector((state: RootState) => state.auth.token) ||
    localStorage.getItem("adminToken");
  const navigate = useNavigate();

  // Instead of day => exercise[], we'll store an array of "day objects"
  const [days, setDays] = useState<IWorkoutPlanDay[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  // We'll track a "new exercise" form
  const [newExercise, setNewExercise] = useState<IWorkoutExercise>({
    drillName: "",
    weight: "",
    reps: "",
    sets: "",
    restTime: "",
  });

  // For editing an existing exercise
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingExercise, setEditingExercise] =
    useState<IWorkoutExercise | null>(null);

  // On load, fetch the existing plan if it exists
  useEffect(() => {
    if (userId && token) {
      axios
        .get(`http://localhost:5000/api/admin/plans/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          // response.data.days is an array of day objects
          const fetchedDays: IWorkoutPlanDay[] = response.data.days || [];
          // We need to adapt drill_name -> drillName, etc. for UI
          const adaptedDays = fetchedDays.map((d) => ({
            ...d,
            exercises: d.exercises.map((ex) => ({
              ...ex,
              drillName: ex.drillName,
              restTime: ex.restTime,
            })),
          }));
          setDays(adaptedDays);
        })
        .catch((error) => {
          console.error("Error fetching workout plan:", error);
        });
    }
  }, [userId, token]);

  // Helper to ensure we have a day object for a given day_number
  const getOrCreateDay = (day_number: number): IWorkoutPlanDay => {
    let dayObj = days.find((d) => d.day_number === day_number);
    if (!dayObj) {
      dayObj = {
        user_id: parseInt(userId || "0", 10),
        day_number,
        exercises: [],
      };
      setDays((prev) => [...prev, dayObj!]);
    }
    return dayObj;
  };

  // Handler to add a new exercise row
  const addExercise = () => {
    if (!newExercise.drillName.trim()) {
      alert("Please enter a drill name");
      return;
    }
    // Get or create the day object
    const dayObj = getOrCreateDay(selectedDayNumber);
    // Insert the new exercise
    const updatedExercises = [...dayObj.exercises, newExercise];
    const updatedDayObj = { ...dayObj, exercises: updatedExercises };

    // Update state
    setDays((prevDays) =>
      prevDays.map((d) =>
        d.day_number === selectedDayNumber ? updatedDayObj : d
      )
    );
    // Clear the newExercise form
    setNewExercise({
      drillName: "",
      weight: "",
      reps: "",
      sets: "",
      restTime: "",
    });
  };

  // Handler to begin editing a specific exercise row
  const startEditing = (index: number, exercise: IWorkoutExercise) => {
    setEditingIndex(index);
    // Copy it so we don't mutate
    setEditingExercise({ ...exercise });
  };

  // Handler to save edited exercise row
  const saveEditedExercise = () => {
    if (editingIndex === null || !editingExercise) return;
    // Update the day’s exercises
    const dayObj = getOrCreateDay(selectedDayNumber);
    const updatedExercises = [...dayObj.exercises];
    updatedExercises[editingIndex] = editingExercise;
    const updatedDayObj = { ...dayObj, exercises: updatedExercises };

    setDays((prev) =>
      prev.map((d) => (d.day_number === selectedDayNumber ? updatedDayObj : d))
    );

    setEditingIndex(null);
    setEditingExercise(null);
  };

  // Handler to save the entire plan for the user
  const savePlan = async () => {
    if (!userId || !token) return;

    // Convert from the UI shape to the backend shape:
    //   drillName => drill_name, restTime => rest_time, etc.
    const backendDays = days.map((d) => ({
      user_id: d.user_id,
      day_number: d.day_number,
      feedback: d.feedback || "",
      done: d.done || false,
      exercises: d.exercises.map((ex) => ({
        drill_name: ex.drillName,
        weight: ex.weight,
        reps: ex.reps,
        sets: ex.sets,
        rest_time: ex.restTime,
      })),
    }));

    try {
      await axios.post(
        `http://localhost:5000/api/admin/plans/${userId}`,
        { days: backendDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Plan saved successfully");
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Error saving workout plan:", error);
      alert("Failed to save workout plan");
    }
  };

  // We'll display the exercises for the currently selectedDayNumber
  const currentDayObj = days.find(
    (d) => d.day_number === selectedDayNumber
  ) || {
    exercises: [],
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Workout Plan Constructor for User {userId}</h1>
      <div>
        <label>
          Select Day:{" "}
          <select
            value={selectedDayNumber}
            onChange={(e) => setSelectedDayNumber(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 90 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                Day {day}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2>Day {selectedDayNumber} Exercises</h2>
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
          {currentDayObj.exercises.map((exercise, index) => (
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
