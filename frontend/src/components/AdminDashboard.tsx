// frontend/src/components/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  email: string;
  height: string;
  weight: string;
  age: number;
  subscription_plan?: string;
  subscription_price?: string;
  training_category?: string;
  unread_count?: number;
  last_feedback?: string; // new
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    id: "",
    email: "",
    height: "",
    weight: "",
    age: "",
    plan: "",
    category: "",
  });
  const adminToken = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      setUsers(response.data.users);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchUsers();
    }
  }, [adminToken]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredUsers = users.filter((user) => {
    const matchId = filters.id ? user.id.toString().includes(filters.id) : true;
    const matchEmail = filters.email
      ? user.email.toLowerCase().includes(filters.email.toLowerCase())
      : true;
    const matchHeight = filters.height
      ? (user.height || "").toString().includes(filters.height)
      : true;
    const matchWeight = filters.weight
      ? (user.weight || "").toString().includes(filters.weight)
      : true;
    const matchAge = filters.age
      ? user.age.toString().includes(filters.age)
      : true;
    const matchPlan = filters.plan
      ? (user.subscription_plan || "")
          .toLowerCase()
          .includes(filters.plan.toLowerCase())
      : true;
    const matchCategory = filters.category
      ? (user.training_category || "")
          .toLowerCase()
          .includes(filters.category.toLowerCase())
      : true;
    return (
      matchId &&
      matchEmail &&
      matchHeight &&
      matchWeight &&
      matchAge &&
      matchPlan &&
      matchCategory
    );
  });

  const handleMessage = (userId: number, userEmail: string) => {
    navigate(`/messages/conversation/${userId}`);
  };

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

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Admin Dashboard</h1>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <input
          type="text"
          name="id"
          placeholder="Filter by ID"
          value={filters.id}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="email"
          placeholder="Filter by Email"
          value={filters.email}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="height"
          placeholder="Filter by Height"
          value={filters.height}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="weight"
          placeholder="Filter by Weight"
          value={filters.weight}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="age"
          placeholder="Filter by Age"
          value={filters.age}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="plan"
          placeholder="Filter by Plan"
          value={filters.plan}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="category"
          placeholder="Filter by Category"
          value={filters.category}
          onChange={handleFilterChange}
        />
      </div>
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
              Last Feedback
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user: User) => (
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
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {user.last_feedback || "None"}
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
                    handlePlanUpdate(user.id, user.subscription_plan ?? null)
                  }
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  {user.subscription_plan ? "Edit Plan" : "Choose a Plan"}
                </button>
                <button
                  onClick={() => handleMessage(user.id, user.email)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Message
                </button>
                <button
                  onClick={() => navigate(`/plans-constructor/${user.id}`)}
                  style={{ padding: "0.5rem", cursor: "pointer" }}
                >
                  Add Work Out Plan
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
