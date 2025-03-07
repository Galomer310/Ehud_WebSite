// src/components/Navbar.tsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { logout } from "../store/authSlice";

// Navbar component with logo placeholder and navigation links.
const Navbar: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle logout: dispatch logout action and navigate to Home.
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <nav
      style={{
        backgroundColor: "#f8f8f8",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Logo placeholder */}
        <img
          src="/logo-placeholder.png"
          alt="Ehud Logo"
          style={{ height: "40px", marginRight: "1rem" }}
        />
        <Link
          to="/"
          style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#333" }}
        >
          Ehud Fitness
        </Link>
      </div>
      <ul
        style={{
          listStyleType: "none",
          display: "flex",
          gap: "1rem",
          margin: 0,
          padding: 0,
        }}
      >
        <li>
          <Link to="/">Home</Link>
        </li>
        {token ? (
          <>
            <li>
              <Link to="/personal">Personal Area</Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "inherit",
                  color: "#007bff",
                }}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
