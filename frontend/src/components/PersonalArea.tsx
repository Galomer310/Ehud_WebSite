// src/components/PersonalArea.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import SubscriptionMenu from "./SubscriptionMenu"; // Import the subscription menu component

const PersonalArea: React.FC = () => {
  // Local state to hold fetched user data from the backend
  const [userData, setUserData] = useState<any>(null);
  // Retrieve the JWT token from Redux state
  const token = useSelector((state: RootState) => state.auth.token);

  // When the component mounts (or token changes), fetch user data from the protected endpoint
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Make a GET request to fetch user data, including subscription details
        const response = await axios.get(
          "http://localhost:5000/api/auth/personal",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Pass the token for authentication
            },
          }
        );
        setUserData(response.data.user); // Set the fetched user data in state
      } catch (error) {
        console.error("Error fetching personal data:", error);
      }
    };

    if (token) {
      fetchUserData(); // Fetch data only if a token exists
    }
  }, [token]);

  // If no token exists, prompt the user to login
  if (!token) {
    return <div>Please login to view your personal area.</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Personal Area</h1>
      {userData ? (
        <div>
          {/* Display the user's email and any other details */}
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          {/* Check for the subscription plan using the exact property names from the database */}
          {userData.subscription_plan ? (
            // If a subscription plan exists, display its details
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
            </div>
          ) : (
            // If no subscription plan exists, show the subscription menu
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
