import React, { useState } from "react";
import { toast } from "sonner";
import { toggleSubscription } from "../api/subscriptions.js";

export const SubscribeButton = ({ channelId, initialIsSubscribed = false, onToggleSuccess }) => {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      await toggleSubscription(channelId);
      const nextState = !isSubscribed;
      setIsSubscribed(nextState);
      toast.success(nextState ? "Subscribed successfully" : "Unsubscribed successfully");
      if (onToggleSuccess) {
        onToggleSuccess(nextState);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      type="button"
      className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
        isSubscribed
          ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          : "bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-sm shadow-purple-600/10"
      } disabled:opacity-50 disabled:pointer-events-none`}
    >
      {loading ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
};

export default SubscribeButton;
