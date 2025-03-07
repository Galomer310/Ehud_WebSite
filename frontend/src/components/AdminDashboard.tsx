// frontend/src/components/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  // Retrieve the admin token from localStorage
  const adminToken = localStorage.getItem("adminToken");

  // Fetch dashboard data (all users) from the backend
  useEffect(() => {
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
    if (adminToken) {
      fetchUsers();
    }
  }, [adminToken]);

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
