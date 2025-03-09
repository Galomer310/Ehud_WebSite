// src/components/SubscriptionMenu.tsx

import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useNavigate } from "react-router-dom";

// SubscriptionMenu: Allows the user to select a training category and a subscription plan
const SubscriptionMenu: React.FC = () => {
  const [step, setStep] = useState(1); // 1: category selection, 2: plan selection
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);

  // Training program categories
  const categories = [
    "Muscle development",
    "Weight Loss",
    "Maintaining a Healthy Lifestyle",
    "performance improving for athletes",
  ];

  // Subscription plan options with descriptions and prices
  const plans = [
    {
      description:
        "Workout plan with one personal call with Ehud at the beginning for 3 months of training ",
      price: "$9",
    },
    {
      description:
        "Workout plan with 3 meetings and plan modifications, one every month for 3 months of training",
      price: "$49",
    },
    {
      description:
        "Workout plan with 6 meetings and plan modifications, once every 2 weeks",
      price: "$99",
    },
    {
      description:
        "Workout plan with an open chat daily feedback and personal escort",
      price: "$149",
    },
  ];

  // Handle selection of a training category
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStep(2);
  };

  // Handle subscription plan selection and update the user's subscription via API
  const handlePlanSelect = async (plan: {
    description: string;
    price: string;
  }) => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/subscribe",
        {
          subscriptionPlan: plan.description,
          subscriptionPrice: plan.price,
          trainingCategory: selectedCategory,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(
        `Subscription updated successfully! You chose the ${selectedCategory} program with the plan: ${plan.description} at ${plan.price}.`
      );
      // Navigate back to Personal Area to display updated data
      navigate("/personal");
    } catch (error: any) {
      console.error("Error updating subscription plan:", error);
      alert("Failed to update subscription plan. Please try again.");
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        padding: "2rem",
        borderRadius: "10px",
        color: "#fff",
        textAlign: "center",
        marginTop: "1rem",
      }}
    >
      {step === 1 && (
        <div>
          <h3>Select a Training Program Category</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategorySelect(category)}
                style={{
                  backgroundColor: "#fff",
                  color: "#333",
                  border: "none",
                  padding: "1rem 2rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h3>{`Category: ${selectedCategory}`}</h3>
          <h4>Select Your Subscription Plan</h4>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            {plans.map((plan, index) => (
              <div
                key={index}
                style={{
                  background: "#fff",
                  color: "#333",
                  padding: "1rem",
                  borderRadius: "8px",
                  width: "250px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {plan.description}
                </p>
                <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                  {plan.price}
                </p>
                <button
                  onClick={() => handlePlanSelect(plan)}
                  style={{
                    backgroundColor: "#fda085",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#333",
            }}
          >
            Back to Categories
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionMenu;
