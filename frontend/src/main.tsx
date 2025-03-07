// Import necessary libraries
import React from "react";
import ReactDOM from "react-dom/client"; // Import ReactDOM for rendering
import { Provider } from "react-redux"; // Import Redux provider for state management
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter for routing
import App from "./App"; // Import the root App component
import store from "./store/store"; // Import the Redux store
import "./style.css";

// Create a root element and render the React application into it
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      {" "}
      {/* Provide the Redux store to the app */}
      <BrowserRouter>
        {" "}
        {/* Enable client-side routing */}
        <App /> {/* Render the main App component */}
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
