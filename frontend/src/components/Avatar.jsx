import React, { useState } from "react";

export const Avatar = ({ src, name = "", size = "md", className = "" }) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-2xl",
    "2xl": "h-24 w-24 text-4xl",
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full overflow-hidden bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 font-semibold select-none flex-shrink-0 ${selectedSize} ${className}`}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name || "User Avatar"}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

export default Avatar;
