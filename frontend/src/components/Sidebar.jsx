import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, ThumbsUp, ListVideo, MessageSquare, History, LayoutDashboard } from "lucide-react";

export const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Subscriptions", icon: Compass, path: "/subscriptions" },
    { label: "Liked Videos", icon: ThumbsUp, path: "/liked-videos" },
    { label: "Playlists", icon: ListVideo, path: "/playlists" },
    { label: "Tweets", icon: MessageSquare, path: "/tweets" },
    { label: "Watch History", icon: History, path: "/history" },
    { label: "Creator Studio", icon: LayoutDashboard, path: "/studio" },
  ];

  return (
    <aside
      className={`fixed top-15 bottom-0 left-0 z-30 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 transition-all duration-200 overflow-y-auto ${
        isOpen ? "w-60" : "w-0 md:w-16"
      }`}
    >
      <div className="p-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/60"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={`transition-opacity duration-150 ${isOpen ? "opacity-100" : "opacity-0 md:hidden"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
