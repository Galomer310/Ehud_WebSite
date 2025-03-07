// src/components/Navbar.tsx

import React from "react"; // Import React
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate for routing
import { useSelector, useDispatch } from "react-redux"; // Import Redux hooks
import { RootState } from "../store/store"; // Import RootState type from Redux store
import { logout } from "../store/authSlice"; // Import the logout action from the auth slice

// Define the Navbar component
const Navbar: React.FC = () => {
  // Get the token from Redux state to check if the user is logged in
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch(); // Get the Redux dispatch function
  const navigate = useNavigate(); // Get the navigate function for programmatic routing

  // Handler to log out the user
  const handleLogout = () => {
    dispatch(logout()); // Dispatch the logout action to clear auth state
    navigate("/"); // Redirect to Home page after logout
  };

  return (
    // Navbar container with basic styling
    <nav style={{ backgroundColor: "#f8f8f8", padding: "1rem" }}>
      <ul
        style={{
          listStyleType: "none",
          display: "flex",
          gap: "1rem",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Always show the Home link */}
        <li>
          <Link to="/">Home</Link>
        </li>
        {token ? (
          // If a token exists (user is logged in), show Personal Area and Logout button
          <>
            <li>
              <Link to="/personal">Personal Area</Link>
            </li>
            <li>
              {/* Logout button styled as a link */}
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
          // If no token exists (user is not logged in), show Register and Login links
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
