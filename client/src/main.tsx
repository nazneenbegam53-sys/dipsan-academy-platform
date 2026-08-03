import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NativeBootstrap } from "./components/NativeBootstrap";
import { MobileTabBar } from "./components/MobileTabBar";
import { BrowserInstallGate } from "./components/BrowserInstallGate";
import { registerServiceWorker } from "./components/InstallAppButton";
import "./index.css";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NativeBootstrap />
        <App />
        <MobileTabBar />
        <BrowserInstallGate />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
