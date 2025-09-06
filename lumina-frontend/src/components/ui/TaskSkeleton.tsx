import React from 'react';
import { Skeleton } from './Skeleton';

interface TaskSkeletonProps {
  count?: number;
}

export const TaskSkeleton: React.FC<TaskSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TaskSkeletonItem key={index} />
      ))}
    </div>
  );
};

const TaskSkeletonItem: React.FC = () => {
  return (
    <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg">
      {/* Completion Toggle */}
      <Skeleton variant="circular" width={20} height={20} className="mr-3" />

      {/* Task Content */}
      <div className="flex-1">
        {/* Title */}
        <Skeleton variant="text" height={16} className="mb-2" />

        {/* Meta Information */}
        <div className="flex items-center gap-2">
          <Skeleton
            variant="rectangular"
            width={60}
            height={20}
            className="rounded-full"
          />
          <Skeleton
            variant="rectangular"
            width={80}
            height={20}
            className="rounded-full"
          />
          <Skeleton
            variant="rectangular"
            width={70}
            height={20}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Actions */}
      <Skeleton variant="circular" width={24} height={24} className="ml-2" />
    </div>
  );
};
