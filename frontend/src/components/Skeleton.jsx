import React from "react";

export const Skeleton = ({ className = "" }) => {
  return <div className={`shimmer-bg rounded ${className}`} />;
};

export const SkeletonVideoCard = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Aspect Ratio 16:9 thumbnail */}
      <Skeleton className="w-full aspect-video rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonVideoGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonVideoCard key={idx} />
      ))}
    </div>
  );
};

export default Skeleton;
