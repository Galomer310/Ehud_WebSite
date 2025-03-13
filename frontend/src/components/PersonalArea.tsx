// frontend/src/components/PersonalArea.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import SubscriptionMenu from "./SubscriptionMenu";

// Define an interface for a single exercise row
interface Exercise {
  drillName: string;
  weight: string;
  reps: string;
  sets: string;
  restTime: string;
}

// If your backend stores dayPlans as { "1": Exercise[], "2": Exercise[], ... }
interface PlanData {
  dayPlans: {
    [day: string]: Exercise[];
  };
}

const PersonalArea: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  // The workout plan, if any
  const [workoutPlan, setWorkoutPlan] = useState<PlanData | null>(null);
  // Unread admin messages
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  // For controlling local "done" + feedback state
  // E.g., { "1": { done: true, feedback: "Felt great" }, "2": { done: false, feedback: "" } }
  const [dayStates, setDayStates] = useState<{
    [day: string]: {
      done: boolean;
      feedback: string;
      showFeedbackInput: boolean;
    };
  }>({});

  const token = useSelector((state: RootState) => state.auth.token);

  // Determine if user is admin or not
  let isAdmin = false;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      isAdmin = decoded?.isAdmin;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  // 1) Fetch user data
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

  // 2) For regular users, fetch unread admin messages
  useEffect(() => {
    if (!isAdmin && token) {
      const fetchNewAdminMessages = async () => {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/messages/new",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setAdminMessages(response.data.messages);
        } catch (error) {
          console.error("Error fetching new admin messages:", error);
        }
      };
      fetchNewAdminMessages();
    }
  }, [token, isAdmin]);

  // 3) Fetch the workout plan from the backend
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/plan",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // If your backend returns { plan: { dayPlans: { "1": [...], ... } } }, store it in workoutPlan
        setWorkoutPlan(response.data.plan);

        // Initialize dayStates with done=false, feedback="" for each day that has exercises
        if (response.data.plan?.dayPlans) {
          const newDayStates: any = {};
          for (const day of Object.keys(response.data.plan.dayPlans)) {
            newDayStates[day] = {
              done: false,
              feedback: "",
              showFeedbackInput: false,
            };
          }
          setDayStates(newDayStates);
        }
      } catch (error) {
        console.error("Error fetching workout plan:", error);
      }
    };
    if (token) {
      fetchPlan();
    }
  }, [token]);

  // 4) Mark an admin message as read
  const handleMarkMessageAsRead = async (messageId: number) => {
    try {
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/read`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAdminMessages(adminMessages.filter((msg) => msg.id !== messageId));
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      alert("Failed to mark message as read");
    }
  };

  // 5) Show the feedback input for a specific day
  const handleMarkAsDoneClick = (day: string) => {
    setDayStates((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        showFeedbackInput: true,
      },
    }));
  };

  // 6) Save feedback for a day (locally)
  // If you want to store feedback in the backend, you'd do a PUT request here
  const handleSaveFeedback = (day: string) => {
    // In this example, we store feedback in local state
    setDayStates((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        done: true,
        showFeedbackInput: false,
      },
    }));
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
              {/* If workoutPlan.dayPlans is defined and not empty, display it */}
              {workoutPlan &&
              workoutPlan.dayPlans &&
              Object.keys(workoutPlan.dayPlans).length > 0 ? (
                <div style={{ marginTop: "1rem" }}>
                  <h2>Your Workout Plan</h2>
                  {Object.entries(workoutPlan.dayPlans).map(
                    ([day, exercises]) => {
                      const dayExercises = exercises as Exercise[];
                      const dayState = dayStates[day] || {
                        done: false,
                        feedback: "",
                        showFeedbackInput: false,
                      };
                      return (
                        <div
                          key={day}
                          style={{
                            marginBottom: "1rem",
                            border: "1px solid #ddd",
                            padding: "0.5rem",
                          }}
                        >
                          <h3
                            style={{
                              textDecoration: dayState.done
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {dayState.done
                              ? `Day ${day} - completed`
                              : `Day ${day}`}
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
                              {dayExercises.map((exercise, index) => (
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
                          {!dayState.done && (
                            <div style={{ marginTop: "0.5rem" }}>
                              {!dayState.showFeedbackInput ? (
                                <button
                                  onClick={() => handleMarkAsDoneClick(day)}
                                  style={{
                                    padding: "0.5rem 1rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  Mark exercise as done
                                </button>
                              ) : (
                                <>
                                  <textarea
                                    placeholder="How did your training go today?"
                                    value={dayState.feedback}
                                    onChange={(e) =>
                                      setDayStates((prev) => ({
                                        ...prev,
                                        [day]: {
                                          ...prev[day],
                                          feedback: e.target.value,
                                        },
                                      }))
                                    }
                                    style={{ width: "100%", padding: "0.5rem" }}
                                  />
                                  <button
                                    onClick={() => handleSaveFeedback(day)}
                                    style={{
                                      marginTop: "0.5rem",
                                      padding: "0.5rem 1rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Save Feedback
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                // If no plan, show subscription plan + waiting message
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
                    updated soon with your new plan. In the meantime, make sure
                    you rest and drink water.
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
          {/* For regular users, display new admin messages (only once) */}
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
