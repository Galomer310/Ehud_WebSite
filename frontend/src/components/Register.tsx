// src/components/Register.tsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // To navigate programmatically

const Register: React.FC = () => {
  // Local state for registration form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    height: "",
    weight: "",
    age: "",
    occupation: "",
    exercise_frequency: "",
    sex: "",
    medical_conditions: "",
  });
  const navigate = useNavigate(); // Hook for navigating

  // Update form data state on change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission for registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send registration request to backend
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
      console.log("Registration successful:", response.data);
      alert(response.data.message);
      // Optionally, navigate to the login page after successful registration
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      // Alert the user with the error message from the backend
      alert(error.response.data.error);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {/* Registration form */}
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
        <input
          type="number"
          step="any"
          name="height"
          placeholder="Height (cm)"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          step="any"
          name="weight"
          placeholder="Weight (kg)"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="age"
          placeholder="Age"
          onChange={handleChange}
        />
        <br />
        <input
          type="text"
          name="occupation"
          placeholder="Occupation"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="exercise_frequency"
          placeholder="Exercise Frequency (times/week)"
          onChange={handleChange}
        />
        <br />
        <select name="sex" onChange={handleChange}>
          <option value="">Select Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <br />
        <textarea
          name="medical_conditions"
          placeholder="Medical Conditions"
          onChange={handleChange}
        />
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
