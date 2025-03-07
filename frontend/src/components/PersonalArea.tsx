import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const PersonalArea: React.FC = () => {
  const [userData, setUserData] = useState<any>(null); // Local state to store fetched user data
  const token = useSelector((state: RootState) => state.auth.token); // Retrieve the token from Redux state

  useEffect(() => {
    // Define an async function to fetch user data from the protected endpoint
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/personal",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
            },
          }
        );
        setUserData(response.data.user); // Store the user data in local state
      } catch (error) {
        console.error("Error fetching personal data:", error); // Log errors if any occur
      }
    };

    if (token) {
      fetchUserData(); // Fetch data only if a token is available
    }
  }, [token]);

  // If no token, prompt the user to log in
  if (!token) {
    return <div>Please login to view your personal area.</div>;
  }

  return (
    <div>
      <h2>Personal Area</h2>
      {userData ? (
        <div>
          <p>Email: {userData.email}</p>
          <p>Height: {userData.height} cm</p>
          <p>Weight: {userData.weight} kg</p>
          <p>Age: {userData.age}</p>
          <p>Occupation: {userData.occupation}</p>
          <p>Exercise Frequency: {userData.exercise_frequency} times/week</p>
          <p>Sex: {userData.sex}</p>
          <p>Medical Conditions: {userData.medical_conditions}</p>
        </div>
      ) : (
        <p>Loading personal data...</p>
      )}
    </div>
  );
};

export default PersonalArea;
