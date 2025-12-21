import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ToastProvider } from "./app/ToastProvider";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);
