// src/components/Footer.tsx

import React from "react";
import { Link } from "react-router-dom";

// Footer component displays social media links and a logo placeholder.
const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: "#333",
        color: "#fff",
        padding: "1rem",
        textAlign: "center",
      }}
    >
      {/* Logo placeholder */}
      <div style={{ marginBottom: "0.5rem" }}>
        <img
          src="/logo-placeholder.png"
          alt="Ehud Logo"
          style={{ height: "40px" }}
        />
      </div>
      {/* Social links */}
      <div>
        <a
          href="https://instagram.com/yourprofile"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#fff", margin: "0 0.5rem" }}
        >
          Instagram
        </a>
        <a
          href="mailto:yourmail@example.com"
          style={{ color: "#fff", margin: "0 0.5rem" }}
        >
          Email
        </a>
        <a
          href="https://facebook.com/yourprofile"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#fff", margin: "0 0.5rem" }}
        >
          Facebook
        </a>
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
        &copy; {new Date().getFullYear()} Ehud Fitness. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
