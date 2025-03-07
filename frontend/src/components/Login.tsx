// src/components/Login.tsx

import React, { useState } from "react"; // Import React and useState for managing local state
import axios from "axios"; // Import Axios for HTTP requests
import { useDispatch } from "react-redux"; // Import Redux dispatch hook
import { login } from "../store/authSlice"; // Import the login action from the auth slice
import { useNavigate } from "react-router-dom"; // Import useNavigate to programmatically navigate

// Define the Login component
const Login: React.FC = () => {
  // Local state for email and password
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const dispatch = useDispatch(); // Get the Redux dispatch function
  const navigate = useNavigate(); // Get the navigate function for routing

  // Update the credentials state when form fields change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // Handle form submission for login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission
    try {
      // Send POST request to login endpoint with credentials
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        credentials
      );
      dispatch(login(response.data)); // Dispatch login action to update Redux state
      navigate("/personal"); // Navigate to Personal Area after successful login
    } catch (error) {
      console.error("Login error:", error); // Log errors if login fails
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {/* Login form */}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
