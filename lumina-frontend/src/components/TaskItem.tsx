import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../types/task';
import { format } from 'date-fns';
import clsx from 'clsx';
import { isDateOverdue } from '../utils/dateHelpers';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  [TaskPriority.LOW]: 'bg-green-100 text-green-800 border-green-200',
  [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TaskPriority.HIGH]: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800 border-gray-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = isDateOverdue(task.dueDate) && !isCompleted;

  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow',
        isCompleted && 'opacity-75'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggleComplete(task.id)}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />

          <div className="flex-1 min-w-0">
            <h3
              className={clsx(
                'text-sm font-medium',
                isCompleted && 'line-through text-gray-500'
              )}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex items-center space-x-2 flex-wrap">
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  priorityColors[task.priority]
                )}
              >
                {task.priority}
              </span>

              <span
                className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  statusColors[task.status]
                )}
              >
                {task.status.replace('_', ' ')}
              </span>

              {task.project && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {task.project}
                </span>
              )}

              {task.dueDate && (
                <span
                  className={clsx(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                    isOverdue
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  )}
                >
                  Due {format(task.dueDate, 'MMM d')}
                </span>
              )}
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="mt-2 flex items-center space-x-1 flex-wrap">
                {task.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Edit task"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};
