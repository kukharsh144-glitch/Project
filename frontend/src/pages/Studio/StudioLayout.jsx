import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { BarChart3, Film, UploadCloud, ArrowLeft } from "lucide-react";

export const StudioLayout = () => {
  const location = useLocation();

  const studioLinks = [
    { label: "Dashboard Overview", icon: BarChart3, path: "/studio" },
    { label: "Content Manager", icon: Film, path: "/studio/videos" },
    { label: "Upload Center", icon: UploadCloud, path: "/studio/upload" },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      {/* Studio left navigation sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-6 p-4">
        {/* Header link to go back to regular client */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-355"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Main Page</span>
        </Link>
        
        <div className="flex flex-col">
          <h2 className="font-black text-lg text-purple-600 tracking-tight">Creator Studio</h2>
          <span className="text-[10px] text-zinc-400">Content & Analytics hub</span>
        </div>

        <nav className="flex flex-col gap-1.5 mt-2">
          {studioLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};

export default StudioLayout;
