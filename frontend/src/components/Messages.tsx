// frontend/src/components/Messages.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { userId } = useParams<{ userId: string }>(); // Retrieve conversation userId from URL (if any)
  // Use Redux token or admin token from localStorage
  const token =
    useSelector((state: RootState) => state.auth.token) ||
    localStorage.getItem("adminToken");

  // Function to fetch messages
  const fetchMessages = async () => {
    try {
      let url = "http://localhost:5000/api/messages";
      if (userId) {
        // If a conversation is specified, fetch that conversation only
        url = `http://localhost:5000/api/messages/conversation/${userId}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    let receiver_id = 0;
    // If admin and conversation is defined, receiver_id is that user
    let isAdmin = false;
    try {
      const decoded = token && JSON.parse(atob(token.split(".")[1]));
      isAdmin = decoded?.isAdmin;
    } catch {
      isAdmin = false;
    }
    if (isAdmin && userId) {
      receiver_id = parseInt(userId, 10);
    }
    // For regular users, receiver_id remains 0 (admin)
    try {
      await axios.post(
        "http://localhost:5000/api/messages",
        { receiver_id, message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      fetchMessages();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Messages {userId && `(Conversation with User ${userId})`}</h1>
      <div style={{ marginBottom: "1rem" }}>
        {messages.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {messages.map((msg) => (
              <li
                key={msg.id}
                style={{
                  marginBottom: "1rem",
                  padding: "0.5rem",
                  background: "#e9e9e9",
                  borderRadius: "4px",
                }}
              >
                <p>
                  <strong>From:</strong> {msg.sender_email}
                </p>
                <p>{msg.message}</p>
                <p style={{ fontSize: "0.8rem", color: "#555" }}>
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No messages yet.</p>
        )}
      </div>
      <div>
        <textarea
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
        <button
          onClick={handleSendMessage}
          style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
};

export default Messages;
