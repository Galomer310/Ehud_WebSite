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

// Define the plan data interface; plan is stored as an object with a dayPlans property,
// where dayPlans keys are day numbers (as strings) and values are arrays of Exercise.
interface PlanData {
  dayPlans: {
    [day: string]: Exercise[];
  };
}

const PersonalArea: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [workoutPlan, setWorkoutPlan] = useState<PlanData | null>(null);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const token = useSelector((state: RootState) => state.auth.token);

  // Decode token to determine if the logged-in user is admin (should be false for regular users)
  let isAdmin = false;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      isAdmin = decoded?.isAdmin;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  // Fetch user data (subscription details, etc.)
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

  // For regular users, fetch unread admin messages (to be shown only once)
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

  // Fetch the workout plan for the user
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/plan",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Expecting response.data.plan to be an object with a dayPlans property
        setWorkoutPlan(response.data.plan);
      } catch (error) {
        console.error("Error fetching workout plan:", error);
      }
    };
    if (token) {
      fetchPlan();
    }
  }, [token]);

  // Handler to mark a specific admin message as read
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
            // If the user has chosen a subscription plan...
            <>
              {/* If a workout plan exists (admin has constructed it), display it */}
              {workoutPlan &&
              workoutPlan.dayPlans &&
              Object.keys(workoutPlan.dayPlans).length > 0 ? (
                <div style={{ marginTop: "1rem" }}>
                  <h2>Your Workout Plan</h2>
                  {Object.entries(workoutPlan.dayPlans).map(
                    ([day, exercises]) => {
                      const dayExercises = exercises as Exercise[]; // Cast to Exercise[]
                      return (
                        <div key={day} style={{ marginBottom: "1rem" }}>
                          <h3>Day {day}</h3>
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
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                // If no workout plan exists, show the subscription plan details along with the waiting message.
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
