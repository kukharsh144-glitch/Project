import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { Camera, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { updateAccountDetails, changeCurrentPassword, updateAvatar, updateCoverImage } from "../api/auth.js";
import { setUser } from "../store/authSlice.js";
import Avatar from "../components/Avatar.jsx";

export const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const { register: regDetails, handleSubmit: handleDetailsSubmit } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    }
  });

  const { register: regPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword } = useForm();
  
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);

  const onDetailsSubmit = async (data) => {
    setDetailsLoading(true);
    try {
      const response = await updateAccountDetails({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
      });
      // Backend returns updated user
      dispatch(setUser(response.data));
      toast.success("Account details updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      await changeCurrentPassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      resetPassword();
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await updateAvatar(formData);
      dispatch(setUser(response.data));
      toast.success("Avatar image updated!");
    } catch (err) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setCoverLoading(true);
    try {
      const formData = new FormData();
      formData.append("coverImage", file);
      const response = await updateCoverImage(formData);
      dispatch(setUser(response.data));
      toast.success("Cover image updated!");
    } catch (err) {
      toast.error(err.message || "Failed to upload cover image");
    } finally {
      setCoverLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8">
      {/* Cover / Profile Banner */}
      <div className="relative h-48 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden group">
        {user?.coverImage ? (
          <img src={user.coverImage} alt="Cover Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-500/20 to-purple-800/10" />
        )}
        <label className="absolute right-4 bottom-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white cursor-pointer transition-colors shadow-lg">
          <Camera className="h-5 w-5" />
          <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={coverLoading} />
        </label>
        {coverLoading && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-semibold">
            Updating Banner...
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Info Block */}
        <div className="flex flex-col items-center gap-3 w-full md:w-1/3 flex-shrink-0 text-center">
          <div className="relative group">
            <Avatar src={user?.avatar} name={user?.fullName} size="2xl" className="border-4 border-white dark:border-zinc-950 shadow-lg" />
            <label className="absolute bottom-1 right-1 p-1.5 bg-purple-600 hover:bg-purple-750 text-white rounded-full cursor-pointer transition-colors shadow-md">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarLoading} />
            </label>
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white text-xs">
                ...
              </div>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-zinc-950 dark:text-zinc-50">{user?.fullName}</h3>
            <p className="text-sm text-zinc-500">@{user?.userName}</p>
          </div>
        </div>

        {/* Forms Sections */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Details Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <UserCheck className="h-5 w-5" />
              <span>Personal Details</span>
            </div>
            
            <form onSubmit={handleDetailsSubmit(onDetailsSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-500">Full Name</label>
                  <input
                    type="text"
                    {...regDetails("fullName", { required: true })}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-500">Email Address</label>
                  <input
                    type="email"
                    {...regDetails("email", { required: true })}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={detailsLoading}
                className="self-end bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-50"
              >
                {detailsLoading ? "Saving Details..." : "Save Details"}
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <KeyRound className="h-5 w-5" />
              <span>Change Password</span>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-500">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...regPassword("oldPassword", { required: true })}
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-500">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...regPassword("newPassword", { required: true, minLength: 6 })}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-500">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...regPassword("confirmPassword", { required: true })}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="self-end bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-50"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
