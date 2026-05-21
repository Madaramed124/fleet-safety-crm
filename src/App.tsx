import React from "react";
import { AppProvider } from "./context/AppContext";
import { AppLayout } from "./components/AppLayout";
import "./index.css";
import { Toaster } from 'sonner';

function App() {
  return (
    <AppProvider>
      <AppLayout />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}

export default App;
