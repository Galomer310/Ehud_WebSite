import React from "react";

// HomePage component displays welcome message and basic information
const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to Ehud Fitness Program</h1> {/* Main title */}
      <p>
        This platform is dedicated to helping you achieve your fitness goals.
        Join us and start your journey today!
      </p>{" "}
      {/* Description text */}
    </div>
  );
};

export default HomePage;
