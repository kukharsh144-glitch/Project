import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Search, Video, Menu, LogOut, LayoutDashboard, User as UserIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { logoutUser } from "../api/auth.js";
import { clearUser } from "../store/authSlice.js";
import Avatar from "./Avatar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(clearUser());
      localStorage.removeItem("isLoggedIn");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to log out");
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-effect bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-2.5 flex items-center justify-between">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-1.5 font-black text-xl tracking-tight text-purple-600 dark:text-purple-400">
          <span>ZooTube</span>
        </Link>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center w-full max-w-lg relative">
        <input
          type="search"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full pl-4 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <button
          type="submit"
          className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Search submit"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {/* Create Upload */}
            <Link
              to="/studio/upload"
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Upload</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center focus:outline-none"
                aria-label="User menu"
              >
                <Avatar src={user?.avatar} name={user?.fullName} size="sm" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-zinc-800 py-1.5 z-20">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate">{user?.fullName}</p>
                      <p className="text-xs text-zinc-500 truncate">@{user?.userName}</p>
                    </div>
                    
                    <Link
                      to={`/channel/${user?.userName}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>My Channel</span>
                    </Link>

                    <Link
                      to="/studio"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Creator Studio</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
