// src/components/PersonalArea.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import SubscriptionMenu from "./SubscriptionMenu"; // Import SubscriptionMenu component

// PersonalArea displays user details and, if available, the chosen subscription plan.
// Otherwise, it prompts the user to choose a plan.
const PersonalArea: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  // Fetch user data (including subscription details) on mount or when token changes.
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

    if (token) fetchUserData();
  }, [token]);

  if (!token) return <div>Please login to view your personal area.</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Personal Area</h1>
      {userData ? (
        <div>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          {/* Display other user details as needed */}
          {userData.subscription_plan ? (
            // If the subscription plan exists, display its details and a friendly message.
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
            // If no subscription plan has been chosen, display the SubscriptionMenu.
            <div>
              <h2>You have not chosen a subscription plan yet.</h2>
              <SubscriptionMenu />
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
