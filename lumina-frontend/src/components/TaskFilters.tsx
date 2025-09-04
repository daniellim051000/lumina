import React from 'react';
import { TaskFilters, TaskPriority, TaskStatus } from '../types/task';

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  availableProjects: string[];
}

export const TaskFiltersComponent: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  availableProjects,
}) => {
  const handleFilterChange = (
    key: keyof TaskFilters,
    value: string | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All statuses</option>
            <option value={TaskStatus.TODO}>To Do</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={filters.priority || ''}
            onChange={e => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All priorities</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.LOW}>Low</option>
          </select>
        </div>

        {/* Project */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            value={filters.project || ''}
            onChange={e => handleFilterChange('project', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All projects</option>
            {availableProjects.map(project => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
