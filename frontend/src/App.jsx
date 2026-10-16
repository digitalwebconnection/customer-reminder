import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AustraliaTimezoneBar from './components/AustraliaTimezoneBar';
import AddReminder from './pages/AddReminder';
import Reminders from './pages/Reminders';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TimezoneProvider } from './context/TimezoneContext';
import { registerServiceWorker } from './utils/pushManager';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* 🇦🇺 Live Australian Timezones Bar pinned across the top */}
      <AustraliaTimezoneBar />
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  // Register service worker on initial load
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <AuthProvider>
      <TimezoneProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* 1. Add Reminder (/add) */}
            <Route
              path="/add"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddReminder />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* 2. All Reminders (/reminders) */}
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reminders />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default Redirection */}
            <Route path="/" element={<Navigate to="/reminders" replace />} />
            <Route path="*" element={<Navigate to="/reminders" replace />} />
          </Routes>
        </BrowserRouter>
      </TimezoneProvider>
    </AuthProvider>
  );
}
