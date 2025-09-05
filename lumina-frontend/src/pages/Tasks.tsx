import React from 'react';
import { TaskListView } from '../components/task/TaskListView';

export const TasksPage: React.FC = () => {
  return (
    <div className="h-full">
      <TaskListView
        onTaskCreate={() => {
          // Could trigger notifications, analytics, etc.
          console.log('Task created successfully');
        }}
        onTaskUpdate={() => {
          // Could trigger notifications, analytics, etc.
          console.log('Task updated successfully');
        }}
      />
    </div>
  );
};
