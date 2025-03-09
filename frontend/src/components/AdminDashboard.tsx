// frontend/src/components/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const adminToken = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  // Fetch users and their unread message counts
  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchUsers();
    }
  }, [adminToken]);

  // Handler for navigating to the conversation with a specific user
  const handleMessage = (userId: number) => {
    navigate(`/messages/conversation/${userId}`);
  };

  // Handler to delete a user with confirmation
  const handleDelete = async (userId: number, userEmail: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete user ${userEmail}?`
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      alert("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  // Handler to update a user's subscription plan details (unchanged)
  const handlePlanUpdate = async (
    userId: number,
    currentPlan: string | null
  ) => {
    const planDescription = window.prompt(
      "Enter the subscription plan description:",
      currentPlan || ""
    );
    if (planDescription === null) return;
    const subscriptionPrice = window.prompt(
      "Enter the subscription price (e.g., $99):",
      ""
    );
    if (subscriptionPrice === null) return;
    const trainingCategory = window.prompt(
      "Enter the training category (e.g., Weight Loss):",
      ""
    );
    if (trainingCategory === null) return;
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/subscribe`,
        {
          subscriptionPlan: planDescription,
          subscriptionPrice,
          trainingCategory,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      alert("Subscription updated successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating subscription plan:", error);
      alert("Failed to update subscription plan");
    }
  };

  // Handler for sending a message (handled in a separate Messages page for admin)
  const handleMessageButton = (userId: number, userEmail: string) => {
    // Navigate to conversation with the selected user
    navigate(`/messages/conversation/${userId}`);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Admin Dashboard</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Height</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Weight</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Age</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Plan</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Price</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Category
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.id}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.email}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.height}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.weight}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.age}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.subscription_plan || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.subscription_price || "N/A"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.training_category || "N/A"}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <button
                  onClick={() => handleDelete(user.id, user.email)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    handlePlanUpdate(user.id, user.subscription_plan)
                  }
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  {user.subscription_plan ? "Edit Plan" : "Choose a Plan"}
                </button>
                <button
                  onClick={() => handleMessageButton(user.id, user.email)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Message
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
