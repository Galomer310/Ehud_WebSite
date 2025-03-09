// frontend/src/components/PersonalArea.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import SubscriptionMenu from "./SubscriptionMenu";

const PersonalArea: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const token = useSelector((state: RootState) => state.auth.token);
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // is admin
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

  // Fetch user details
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

  // Fetch new (unread) admin messages for the personal area only once
  useEffect(() => {
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
    if (token) {
      fetchNewAdminMessages();
    }
  }, [token]);

  // Handler to mark a specific message as read (when user clicks "Message received")
  const handleMarkMessageAsRead = async (messageId: number) => {
    try {
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/read`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Remove the message from the local state so it no longer displays in the personal area
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
            <div>
              <h2>You have not chosen a subscription plan yet.</h2>
              <SubscriptionMenu />
            </div>
          )}
          {/* Display new admin messages (only once) */}
          {adminMessages.length > 0 && (
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
