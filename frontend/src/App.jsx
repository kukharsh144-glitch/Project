import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "sonner";
import { getCurrentUser } from "./api/auth.js";
import { setUser, setLoading } from "./store/authSlice.js";
import { Link } from "react-router-dom";

// Layout & Components
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Watch from "./pages/Watch.jsx";
import Search from "./pages/Search.jsx";
import Channel from "./pages/Channel.jsx";
import Subscriptions from "./pages/Subscriptions.jsx";
import LikedVideos from "./pages/LikedVideos.jsx";
import WatchHistory from "./pages/WatchHistory.jsx";
import Playlists from "./pages/Playlists.jsx";
import Tweets from "./pages/Tweets.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// Studio Pages
import StudioLayout from "./pages/Studio/StudioLayout.jsx";
import Overview from "./pages/Studio/Overview.jsx";
import VideoManagement from "./pages/Studio/VideoManagement.jsx";
import Upload from "./pages/Studio/Upload.jsx";

// Global layout wrapper with sidebar and topbar
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} />
        {/* Main content wrapper */}
        <div className={`flex-1 transition-all duration-200 ${sidebarOpen ? "pl-0 md:pl-60" : "pl-0 md:pl-16"}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        dispatch(setUser(null));
        dispatch(setLoading(false));
        return;
      }

      // Check if session exists in browser cookies by loading current user profile
      try {
        const response = await getCurrentUser();
        // Backend returns: { statusCode: 200, data: user_object, message: "..." }
        const loggedUser = response.data || response;
        dispatch(setUser(loggedUser));
      } catch (err) {
        // Clear flags if not authenticated
        dispatch(setUser(null));
        localStorage.removeItem("isLoggedIn");
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
      
      <Routes>
        {/* Guest only routes (login, register) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* User Secure/Protected Routes inside the global layout */}
        <Route element={<ProtectedRoute />}>
          {/* Main App Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:videoId" element={<Watch />} />
            <Route path="/search" element={<Search />} />
            <Route path="/channel/:username" element={<Channel />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/liked-videos" element={<LikedVideos />} />
            <Route path="/history" element={<WatchHistory />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/tweets" element={<Tweets />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Creator Studio Layout (separate panel structure) */}
          <Route path="/studio" element={<StudioLayout />}>
            <Route index element={<Overview />} />
            <Route path="videos" element={<VideoManagement />} />
            <Route path="upload" element={<Upload />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-3xl font-black text-purple-600 dark:text-purple-400">404</h2>
              <p className="font-bold mt-2">Page Not Found</p>
              <Link to="/" className="mt-4 text-xs font-semibold text-purple-550 hover:underline">
                Go back home
              </Link>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
