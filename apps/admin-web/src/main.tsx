import React from "react";
import ReactDOM from "react-dom/client";

import { AdminApp } from "./AdminApp";
import { AdminSessionProvider } from "./core/auth";
import { AdminRouterProvider } from "./core/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminRouterProvider>
      <AdminSessionProvider>
        <AdminApp />
      </AdminSessionProvider>
    </AdminRouterProvider>
  </React.StrictMode>
);
