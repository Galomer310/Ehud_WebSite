import React, { useState } from "react";
import axios from "axios";

const Register: React.FC = () => {
  // Define state for form data using the useState hook
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

  // Handle form field changes by updating the corresponding state value
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission and send registration data to the backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior
    try {
      // Post the registration data to the backend endpoint
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
      console.log("Registered:", response.data); // Log the successful registration response
    } catch (error) {
      console.error("Registration error:", error); // Log any errors during registration
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
