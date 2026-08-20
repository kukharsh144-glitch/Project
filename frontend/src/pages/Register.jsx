import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerUser } from "../api/auth.js";

export const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data) => {
    if (!avatarFile) {
      toast.error("Avatar image is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName.trim());
      formData.append("userName", data.userName.trim().toLowerCase());
      formData.append("email", data.email.trim());
      formData.append("password", data.password);
      formData.append("avatar", avatarFile);
      if (coverFile) {
        formData.append("coverImage", coverFile);
      }

      await registerUser(formData);
      toast.success("Account registered successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400">Join ZooTube</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create your creator profile to start publishing</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Your display name"
              {...register("fullName", { required: "Full name is required" })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="userName">Username</label>
            <input
              id="userName"
              type="text"
              placeholder="choose_username"
              {...register("userName", { required: "Username is required" })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            {errors.userName && <span className="text-xs text-red-500">{errors.userName.message}</span>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          </div>

          {/* Avatar Input (Required) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="avatar">Avatar Image (Required)</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="w-full text-sm text-zinc-500 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-950/40 dark:file:text-purple-400 hover:file:bg-purple-100"
            />
          </div>

          {/* Cover Image Input (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="coverImage">Cover Image (Optional)</label>
            <input
              id="coverImage"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="w-full text-sm text-zinc-500 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-950/40 dark:file:text-purple-400 hover:file:bg-purple-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
