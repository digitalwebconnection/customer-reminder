import React, { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
// Layout Components
import { Navbar, AustraliaTimezoneBar, MobileBottomNav, AdminLayout } from "./components/layout";

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

// Background Services
import { registerServiceWorker } from "./services/pushManager";
import { initRenderKeepAlive } from "./services/renderKeepAlive";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    try {
      const saved = localStorage.getItem("remindiq_sidebar_collapsed");
      if (saved !== null) return saved === "true";
      // Auto-collapse sidebar on tablet screens (< 1024px) for full responsiveness
      return typeof window !== "undefined" && window.innerWidth < 1024;
    } catch (e) {
      return false;
    }
  });

  // Adjust on resize if no manual preference saved
  useEffect(() => {
    const handleResize = () => {
      try {
        const saved = localStorage.getItem("remindiq_sidebar_collapsed");
        if (saved === null) {
          setIsSidebarCollapsed(window.innerWidth < 1024);
        }
      } catch (e) {}
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Global listener: If push alarm is received or clicked while on any page, route to the ringing screen
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleSwMessage = (e) => {
      if (!e.data) return;
      if (
        e.data.type === "CALL_REMINDER_NOTIFICATION_CLICK" ||
        e.data.type === "PUSH_ALARM_RECEIVED"
      ) {
        const { reminderId, userId: msgUserId } = e.data.data || {};
        if (msgUserId && user?._id && String(msgUserId) !== String(user._id)) {
          return;
        }
        if (reminderId) {
          if (String(reminderId).startsWith("test-") || reminderId === "test-alert") {
            return;
          }
          const target = `/reminders?alertId=${reminderId}`;
          if (
            location.pathname !== "/reminders" ||
            !location.search.includes(reminderId)
          ) {
            navigate(target);
          }
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
  }, [navigate, location, user]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("remindiq_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-x-clip selection:bg-zinc-700 selection:text-white">
      {/* Subtle Dark Background Mesh */}
      <div className="fixed inset-0 pointer-events-none bg-zinc-950/40 z-0" />

      {/* Left-Side Slider Navigation (Desktop Fixed Sidebar + Mobile Slide-Over Drawer) */}
      <Navbar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area: Offset by sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 w-full ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* 🇦🇺 Live Australian Timezones Bar - Stationary/Static at Top */}
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
                  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
                    <span className="text-xs text-zinc-500 font-mono">
                      Loading RemindIQ...
                    </span>
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
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
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
