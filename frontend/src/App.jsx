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
import { ToastProvider } from './context/ToastContext';
import { PwaProvider } from './context/PwaContext';
import InstallPwaBanner from './components/InstallPwaBanner';
import InstallPwaModal from './components/InstallPwaModal';
import MobileBottomNav from './components/MobileBottomNav';
import { registerServiceWorker } from './utils/pushManager';
import { initRenderKeepAlive } from './utils/renderKeepAlive';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient Background Grid & Glow (Magic UI style) */}
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-30 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-125 bg-radial-ambient pointer-events-none z-0" />

      {/* 🇦🇺 Live Australian Timezones Bar pinned across the top */}
      <div className="relative z-20">
        <AustraliaTimezoneBar />
        <Navbar />
      </div>

      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Experience: Floating Install Banner, Install Modal & Native Bottom Navigation */}
      <InstallPwaBanner />
      <InstallPwaModal />
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  // Register service worker and start 14-min Render keep-alive on initial load
  useEffect(() => {
    registerServiceWorker();
    initRenderKeepAlive();
  }, []);

  return (
    <AuthProvider>
      <PwaProvider>
        <TimezoneProvider>
          <ToastProvider>
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
          </ToastProvider>
        </TimezoneProvider>
      </PwaProvider>
    </AuthProvider>
  );
}
