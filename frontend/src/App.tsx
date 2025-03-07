// src/App.tsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import Register from "./components/Register";
import Login from "./components/Login";
import PersonalArea from "./components/PersonalArea";
import Navbar from "./components/Navbar"; // Import the updated Navbar component

const App: React.FC = () => {
  return (
    <div>
      {/* Render the Navbar on every page */}
      <Navbar />
      {/* Define application routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/personal" element={<PersonalArea />} />
      </Routes>
    </div>
  );
};

export default App;
