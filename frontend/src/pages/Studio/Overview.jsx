import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Film, Eye, Users, ThumbsUp, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getChannelStats } from "../../api/dashboard.js";
import { Skeleton } from "../../components/Skeleton.jsx";

export const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getChannelStats();
        // Backend returns: { totalVideos, totalViews, totalSubscribers, totalLikes }
        setStats(response.data || response);
      } catch (err) {
        toast.error(err.message || "Failed to load channel stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Make real chart dates dynamically based on actual database stats views Performance
  const generateChartData = () => {
    if (!stats) return [];
    
    // Map backend date keys (YYYY-MM-DD) to views count
    const perfMap = {};
    if (stats.viewsPerformance && Array.isArray(stats.viewsPerformance)) {
      stats.viewsPerformance.forEach((item) => {
        perfMap[item._id] = item.views;
      });
    }
    
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      // Format to YYYY-MM-DD to match backend keys
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const realViews = perfMap[dateKey] || 0;
      
      data.push({
        name: dateLabel,
        Views: realViews,
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Views", val: stats?.totalViews || 0, icon: Eye, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { label: "Subscribers", val: stats?.totalSubscribers || 0, icon: Users, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" },
    { label: "Total Videos", val: stats?.totalVideos || 0, icon: Film, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { label: "Total Likes", val: stats?.totalLikes || 0, icon: ThumbsUp, color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">Dashboard Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">Track your channel performance and viewer metrics</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-zinc-500">{card.label}</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{card.val}</span>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Block */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          <span>Views performance (Last 7 Days)</span>
        </div>
        
        <div className="h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generateChartData()}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="Views" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Overview;
