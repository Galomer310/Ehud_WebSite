// frontend/src/components/PersonalArea.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import SubscriptionMenu from "./SubscriptionMenu"; // Component for choosing a subscription plan

const PersonalArea: React.FC = () => {
  // Local state for storing the user's details
  const [userData, setUserData] = useState<any>(null);
  // Local state for storing messages for the logged-in user
  const [messages, setMessages] = useState<any[]>([]);
  // Retrieve the JWT token from Redux state
  const token = useSelector((state: RootState) => state.auth.token);

  // Fetch user data from the protected endpoint when component mounts or token changes
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

  // Fetch messages for the logged-in user from the messaging endpoint
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/messages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(response.data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (token) {
      fetchMessages();
    }
  }, [token]);

  // If the user is not logged in, prompt them to log in
  if (!token) {
    return <div>Please login to view your personal area.</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Personal Area</h1>
      {userData ? (
        <div>
          {/* Display basic user details */}
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          {/* Display subscription details if available */}
          {userData.subscription_plan ? (
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
                <strong>Category:</strong> {userData.training_category || "N/A"}
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
                updated soon with your new plan. In the meantime, make sure you
                rest and drink water.
              </p>
            </div>
          ) : (
            // If no subscription exists, show the SubscriptionMenu for the user to choose a plan
            <div>
              <h2>You have not chosen a subscription plan yet.</h2>
              <SubscriptionMenu />
            </div>
          )}
          {/* Display the Messages section */}
          <div style={{ marginTop: "2rem" }}>
            <h2>Messages</h2>
            {messages.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    style={{
                      marginBottom: "1rem",
                      padding: "0.5rem",
                      background: "#e9e9e9",
                      borderRadius: "4px",
                    }}
                  >
                    <p>
                      <strong>From:</strong> {msg.sender_email || "Admin"}
                    </p>
                    <p>{msg.message}</p>
                    <p style={{ fontSize: "0.8rem", color: "#555" }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No messages.</p>
            )}
          </div>
        </div>
      ) : (
        <p>Loading personal data...</p>
      )}
    </div>
  );
};

export default PersonalArea;
