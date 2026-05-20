import React from "react";
import { AppProvider } from "./context/AppContext";
import { AppLayout } from "./components/AppLayout";
import "./index.css";

function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
