// frontend/src/components/AdminLogin.tsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  // Local state for admin credentials
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // Update state as the admin types in the input fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // Handle form submission for admin login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send a POST request to the admin login endpoint
      const response = await axios.post(
        "http://localhost:5000/api/admin/login",
        credentials
      );
      // Store the admin token (e.g., in localStorage)
      localStorage.setItem("adminToken", response.data.token);
      // Navigate to the admin dashboard
      navigate("/admin/dashboard");
    } catch (error: any) {
      alert("Invalid admin credentials");
      console.error("Admin login error:", error);
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Admin Email"
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

export default AdminLogin;
