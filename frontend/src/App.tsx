// frontend/src/App.tsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import Register from "./components/Register";
import Login from "./components/Login";
import PersonalArea from "./components/PersonalArea";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import Messages from "./components/Messages";
import PlansConstructor from "./components/PlansConstructor"; // New component

const App: React.FC = () => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/personal" element={<PersonalArea />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/conversation/:userId" element={<Messages />} />
          <Route
            path="/plans-constructor/:userId"
            element={<PlansConstructor />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
