import React from 'react';
import { Task, TaskFilters } from '../types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  filters: TaskFilters;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  filters,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      if (filters.project && task.project !== filters.project) {
        return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description
          ?.toLowerCase()
          .includes(searchLower);
        const matchesTags = task.tags?.some(tag =>
          tag.toLowerCase().includes(searchLower)
        );

        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No tasks found
        </h3>
        <p className="text-sm text-gray-500">
          {Object.keys(filters).some(key => filters[key as keyof TaskFilters])
            ? 'Try adjusting your filters to see more tasks.'
            : 'Create your first task to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
