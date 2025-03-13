// frontend/src/components/PersonalArea.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import SubscriptionMenu from "./SubscriptionMenu";
import { IWorkoutPlanDay, IWorkoutExercise } from "../types";

const PersonalArea: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  // The list of days + exercises
  const [days, setDays] = useState<IWorkoutPlanDay[]>([]);
  // For unread admin messages (same as your current usage)
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const token = useSelector((state: RootState) => state.auth.token);

  let isAdmin = false;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      isAdmin = decoded?.isAdmin;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/personal",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserData(response.data.user);
      } catch (error) {
        console.error("Error fetching personal data:", error);
      }
    };
    if (token) {
      fetchUserData();
    }
  }, [token]);

  // For regular users, fetch unread admin messages
  useEffect(() => {
    if (token && !isAdmin) {
      axios
        .get("http://localhost:5000/api/messages/new", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setAdminMessages(response.data.messages);
        })
        .catch((error) => {
          console.error("Error fetching new admin messages:", error);
        });
    }
  }, [token, isAdmin]);

  // Fetch structured plan
  useEffect(() => {
    if (token) {
      axios
        .get("http://localhost:5000/api/auth/plan-structured", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const fetchedDays = response.data.days || [];
          // Convert any 'drill_name' back to 'drillName', etc. if needed
          const adaptedDays = fetchedDays.map((d: any) => ({
            ...d,
            exercises: d.exercises.map((ex: any) => ({
              ...ex,
              drillName: ex.drill_name,
              restTime: ex.rest_time,
            })),
          }));
          setDays(adaptedDays);
        })
        .catch((error) => {
          console.error("Error fetching workout plan:", error);
        });
    }
  }, [token]);

  // Mark an admin message as read
  const handleMarkMessageAsRead = async (messageId: number) => {
    try {
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/read`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdminMessages(adminMessages.filter((msg) => msg.id !== messageId));
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      alert("Failed to mark message as read");
    }
  };

  // Handler to save feedback for a specific day
  const [editingFeedbackForDay, setEditingFeedbackForDay] = useState<
    number | null
  >(null);
  const [feedbackText, setFeedbackText] = useState("");

  const handleMarkAsDoneClick = (dayId: number, existingFeedback?: string) => {
    // Show a textarea for feedback
    setEditingFeedbackForDay(dayId);
    setFeedbackText(existingFeedback || "");
  };

  const handleSaveFeedback = async (dayId: number) => {
    try {
      await axios.put(
        `http://localhost:5000/api/auth/day/${dayId}/feedback`,
        { feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      setDays((prevDays) =>
        prevDays.map((d) => {
          if (d.id === dayId) {
            return {
              ...d,
              feedback: feedbackText,
              done: !!feedbackText.trim(),
            };
          }
          return d;
        })
      );
      setEditingFeedbackForDay(null);
      setFeedbackText("");
    } catch (error: any) {
      console.error("Error saving feedback:", error);
      alert("Failed to save feedback");
    }
  };

  if (!token) {
    return <div>Please login to view your personal area.</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Personal Area</h1>
      {userData ? (
        <div>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          {userData.subscription_plan ? (
            <>
              {days.length > 0 ? (
                <div style={{ marginTop: "1rem" }}>
                  <h2>Your Workout Plan</h2>
                  {days.map((day) => (
                    <div
                      key={day.id}
                      style={{
                        marginBottom: "1rem",
                        border: "1px solid #ddd",
                        padding: "0.5rem",
                      }}
                    >
                      <h3
                        style={{
                          textDecoration: day.done ? "line-through" : "none",
                        }}
                      >
                        Day {day.day_number} {day.done && "- completed"}
                      </h3>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                              }}
                            >
                              Drill Name
                            </th>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                              }}
                            >
                              Weight
                            </th>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                              }}
                            >
                              Reps
                            </th>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                              }}
                            >
                              Sets
                            </th>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                              }}
                            >
                              Rest Time
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises.map((exercise, index) => (
                            <tr key={index}>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                {exercise.drillName}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                {exercise.weight}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                {exercise.reps}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                {exercise.sets}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                {exercise.restTime}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* If day not done, show "Mark exercise as done" or the feedback input */}
                      {!day.done && editingFeedbackForDay !== day.id && (
                        <button
                          onClick={() =>
                            handleMarkAsDoneClick(
                              day.id || 0,
                              day.feedback || ""
                            )
                          }
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem 1rem",
                            cursor: "pointer",
                          }}
                        >
                          Mark exercise as done
                        </button>
                      )}

                      {editingFeedbackForDay === day.id && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <textarea
                            placeholder="How did your training go today?"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            style={{ width: "100%", padding: "0.5rem" }}
                          />
                          <button
                            onClick={() => handleSaveFeedback(day.id || 0)}
                            style={{
                              marginTop: "0.5rem",
                              padding: "0.5rem 1rem",
                              cursor: "pointer",
                            }}
                          >
                            Save Feedback
                          </button>
                        </div>
                      )}

                      {/* If the day has feedback, display it */}
                      {day.feedback && (
                        <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                          Feedback: {day.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: "#f0f0f0",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginTop: "1rem",
                  }}
                >
                  <h2>Your Subscription Plan</h2>
                  <p>
                    <strong>Category:</strong>{" "}
                    {userData.training_category || "N/A"}
                  </p>
                  <p>
                    <strong>Plan:</strong> {userData.subscription_plan}
                  </p>
                  <p>
                    <strong>Price:</strong> {userData.subscription_price}
                  </p>
                  <p
                    style={{
                      marginTop: "1rem",
                      fontStyle: "italic",
                      color: "#555",
                    }}
                  >
                    Your choices have been sent to Ehud. Your Dashboard will be
                    updated soon with your new plan. In the meantime, rest and
                    stay hydrated!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <h2>You have not chosen a subscription plan yet.</h2>
              <SubscriptionMenu />
            </div>
          )}
          {/* For regular users, display new admin messages */}
          {!isAdmin && adminMessages.length > 0 && (
            <div
              style={{
                marginTop: "2rem",
                backgroundColor: "#fff3cd",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <h2>New Message from Admin</h2>
              {adminMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    border: "1px solid #ffeeba",
                    borderRadius: "4px",
                  }}
                >
                  <p>{msg.message}</p>
                  <p style={{ fontSize: "0.8rem", color: "#555" }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleMarkMessageAsRead(msg.id)}
                    style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
                  >
                    Message received
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>Loading personal data...</p>
      )}
    </div>
  );
};

export default PersonalArea;
