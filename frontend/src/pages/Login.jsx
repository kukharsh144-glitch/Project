import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { loginUser } from "../api/auth.js";
import { setUser } from "../store/authSlice.js";

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await loginUser({
        userName: data.identity.includes("@") ? undefined : data.identity,
        email: data.identity.includes("@") ? data.identity : undefined,
        password: data.password,
      });
      // The backend response format: { statusCode: 200, data: { User, accessToken, refreshToken }, message: "..." }
      const loggedUser = response.data?.User || response.data?.user;
      dispatch(setUser(loggedUser));
      localStorage.setItem("isLoggedIn", "true");
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to sign in. Verify details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400">Welcome to ZooTube</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Identity Field (Email or Username) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="identity">Email or Username</label>
            <input
              id="identity"
              type="text"
              placeholder="Enter email or username"
              {...register("identity", { required: "Username or email is required" })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            {errors.identity && <span className="text-xs text-red-500">{errors.identity.message}</span>}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-500" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
