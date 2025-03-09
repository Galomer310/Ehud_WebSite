// frontend/src/components/Navbar.tsx

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // For navigation
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { logout } from "../store/authSlice";
import axios from "axios";

const Navbar: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Determine if the logged-in user is an admin
  let isAdmin = false;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      isAdmin = decoded?.isAdmin;
    } catch (error) {
      console.error("Error decoding token in Navbar:", error);
    }
  }

  // For regular users (not admin), fetch unread admin messages count from /api/messages/new
  useEffect(() => {
    if (token && !isAdmin) {
      axios
        .get("http://localhost:5000/api/messages/new", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUnreadCount(response.data.messages.length);
        })
        .catch((error) => {
          console.error("Error fetching unread messages in Navbar:", error);
        });
    }
  }, [token, isAdmin]);

  // When the user clicks on the Messages link, clear the unread count.
  const handleMessagesClick = () => {
    setUnreadCount(0);
  };

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
        <img
          src="/logo-placeholder.png"
          alt="Ehud Logo"
          style={{ height: "40px", marginRight: "1rem" }}
        />
        <Link
          to="/"
          style={{
            fontWeight: "bold",
            fontSize: "1.2rem",
            color: "#333",
            textDecoration: "none",
          }}
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
        {token && (
          <li>
            <Link to="/messages" onClick={handleMessagesClick}>
              Messages{" "}
              {unreadCount > 0 && (
                <span style={{ color: "red" }}>({unreadCount})</span>
              )}
            </Link>
          </li>
        )}
        <li>
          <Link to="/admin/login">Admin</Link>
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
