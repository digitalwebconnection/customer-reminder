import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
// Layout Components
import {
  Navbar,
  AustraliaTimezoneBar,
  MobileBottomNav,
  AdminLayout,
} from "./components/layout";

// Lazy-loaded Domain Pages (Code-splitting for faster initial page load & mobile performance)
const AddReminder = lazy(() => import("./pages/reminders/AddReminder"));
const Reminders = lazy(() => import("./pages/reminders/Reminders"));
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Profile = lazy(() => import("./pages/profile/Profile"));

// Super Admin Domain Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReminders = lazy(() => import("./pages/admin/AdminReminders"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));

// Route Guards
import { ProtectedRoute, AdminRoute, GuestRoute } from "./routes";

// Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TimezoneProvider } from "./context/TimezoneContext";
import { ToastProvider } from "./context/ToastContext";
import { PwaProvider } from "./context/PwaContext";

// Helper for regular user routes (super admin redirected to /admin)
function UserOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === "superadmin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

// Smart default route based on role
function RoleBasedHome() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "superadmin") return <Navigate to="/admin" replace />;
  return <Navigate to="/reminders" replace />;
}

// Modals & PWA Components
import { InstallPwaBanner, InstallPwaModal } from "./components/pwa";
import { LogoutConfirmationModal } from "./components/modals";
import RemindIQLogo from "./components/common/RemindIQLogo";

// Background Services
import { registerServiceWorker } from "./services/pushManager";
import { initRenderKeepAlive } from "./services/renderKeepAlive";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("remindiq_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("remindiq_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Super Admin should NEVER use the dark user Layout (Image 1) - route directly to Super Admin dashboard (Image 2)
  if (user?.role === "superadmin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-apple-theme min-h-screen text-slate-800 flex flex-col relative overflow-x-clip selection:bg-amber-100 selection:text-amber-900">
      {/* Ambient Liquid Glass Background Slabs & Prisms */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute -top-14 -left-20 w-[460px] h-32 rounded-full ambient-liquid-slab transform -rotate-12 opacity-85" />
        <div className="absolute top-16 -right-28 w-[520px] h-36 rounded-full ambient-liquid-slab transform rotate-6 opacity-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-48 rounded-[50px] ambient-liquid-slab transform -rotate-2 opacity-50 pointer-events-none" />
        <div className="absolute -bottom-14 -left-16 w-[480px] h-36 rounded-full ambient-liquid-slab transform rotate-8 opacity-80" />
        <div className="absolute -bottom-16 -right-20 w-[540px] h-40 rounded-full ambient-liquid-slab transform -rotate-6 opacity-85" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/25 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Left Sidebar Navigation: Sliding Open/Close */}
      <Navbar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area: Smooth desktop padding transition for sidebar collapse */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* 🇦🇺 Live Australian Timezones Bar - Pinned at top of workspace */}
        <div className="sticky top-14 md:top-0 z-30">
          <AustraliaTimezoneBar />
        </div>

        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full min-w-0 mx-auto relative z-10 pb-28 sm:pb-32 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Experience: Floating Install Banner, Install Modal, Alarm Permissions Hub & Native Bottom Navigation */}
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
              <LogoutConfirmationModal />
              <Suspense
                fallback={
                  <div className="admin-apple-theme min-h-screen flex flex-col items-center justify-center p-4 relative selection:bg-amber-100 select-none">
                    <div className="liquid-glass-modal px-8 py-6 rounded-3xl flex flex-col items-center gap-3.5 shadow-xl animate-in fade-in duration-200">
                      <RemindIQLogo size="lg" />
                      <span className="text-xs font-bold text-slate-500 tracking-tight">
                        Loading Workspace...
                      </span>
                    </div>
                  </div>
                }
              >
                <Routes>
                  {/* Public Guest Auth Routes */}
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/signin"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/sign-in"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <GuestRoute>
                        <SignUp />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestRoute>
                        <SignUp />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/sign-up"
                    element={
                      <GuestRoute>
                        <SignUp />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute>
                        <ForgotPassword />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/reset-password/:token"
                    element={
                      <GuestRoute>
                        <ResetPassword />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={<Navigate to="/forgot-password" replace />}
                  />

                  {/* Standard Dashboard Route (Routes by Role) */}
                  <Route path="/dashboard" element={<RoleBasedHome />} />

                  {/* Authenticated User Workspace Routes */}
                  <Route
                    path="/reminders"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <Reminders />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reminders/add"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <AddReminder />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <AddReminder />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-reminder"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <AddReminder />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <Profile />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <Profile />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <Layout>
                            <Profile />
                          </Layout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />

                  {/* Super Admin Protected Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <AdminLayout>
                          <AdminUsers />
                        </AdminLayout>
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/reminders"
                    element={
                      <AdminRoute>
                        <AdminLayout>
                          <AdminReminders />
                        </AdminLayout>
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/logs"
                    element={
                      <AdminRoute>
                        <AdminLayout>
                          <AdminActivityLogs />
                        </AdminLayout>
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/activity-logs"
                    element={
                      <AdminRoute>
                        <AdminLayout>
                          <AdminActivityLogs />
                        </AdminLayout>
                      </AdminRoute>
                    }
                  />

                  {/* Default Navigation Fallbacks */}
                  <Route path="/" element={<RoleBasedHome />} />
                  <Route path="/home" element={<RoleBasedHome />} />
                  <Route path="*" element={<RoleBasedHome />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </TimezoneProvider>
      </PwaProvider>
    </AuthProvider>
  );
}
