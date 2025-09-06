import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Flag,
  FolderOpen,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  MoreVertical,
  HelpCircle,
} from 'lucide-react';
import {
  TaskListItem,
  Task,
  TaskFilters,
  Priority,
  Project,
  Label,
} from '../../types/task';
import { apiService } from '../../services/api';
import { TaskModal } from './TaskModal';
import {
  useKeyboardShortcuts,
  createTaskManagementShortcuts,
  useKeyboardShortcutsHelp,
} from '../../hooks/useKeyboardShortcuts';
import { TaskSkeleton } from '../ui/TaskSkeleton';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { useToast } from '../../contexts/ToastContext';

interface TaskListViewProps {
  onTaskCreate?: () => void;
  onTaskUpdate?: () => void;
}

const priorityConfig = {
  P1: {
    label: 'P1',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
  P2: {
    label: 'P2',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  P3: {
    label: 'P3',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  P4: {
    label: 'P4',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  '': {
    label: '',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

const viewFilters = {
  all: { label: 'All Tasks', icon: Circle },
  today: { label: 'Today', icon: Calendar },
  week: { label: 'This Week', icon: Calendar },
  overdue: { label: 'Overdue', icon: AlertTriangle },
  completed: { label: 'Completed', icon: CheckCircle2 },
};

export const TaskListView: React.FC<TaskListViewProps> = ({
  onTaskCreate,
  onTaskUpdate,
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filters and UI state
  const [filters, setFilters] = useState<TaskFilters>({});
  const [currentView, setCurrentView] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts help
  const { showHelp } = useKeyboardShortcutsHelp();

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData, labelsData] = await Promise.all([
        apiService.getTasks(),
        apiService.getProjects(),
        apiService.getLabels(),
      ]);

      setTasks(tasksData);
      setProjects(projectsData);
      setLabels(labelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = useCallback(async () => {
    try {
      const taskFilters: TaskFilters = { ...filters };

      // Apply view-specific filters
      switch (currentView) {
        case 'today':
          taskFilters.view = 'today';
          break;
        case 'week':
          taskFilters.view = 'week';
          break;
        case 'overdue':
          taskFilters.view = 'overdue';
          break;
        case 'completed':
          taskFilters.completed = true;
          break;
      }

      // Add search query
      if (searchQuery.trim()) {
        taskFilters.search = searchQuery.trim();
      }

      const tasksData = await apiService.getTasks(taskFilters);
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
  }, [filters, currentView, searchQuery]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load tasks when filters change
  useEffect(() => {
    if (!loading) {
      loadTasks();
    }
  }, [loadTasks, loading]);

  // Keyboard shortcuts setup
  const taskManagementShortcuts = createTaskManagementShortcuts({
    createTask: () => setShowTaskModal(true),
    searchFocus: () => searchInputRef.current?.focus(),
    toggleFilters: () => setShowFilters(prev => !prev),
    selectToday: () => setCurrentView('today'),
    selectWeek: () => setCurrentView('week'),
    selectOverdue: () => setCurrentView('overdue'),
    selectCompleted: () => setCurrentView('completed'),
    refresh: () => loadTasks(),
  });

  useKeyboardShortcuts(taskManagementShortcuts, !showTaskModal);

  const handleTaskToggleComplete = async (task: TaskListItem) => {
    const wasCompleted = task.is_completed;
    try {
      await apiService.updateTask(task.id, {
        is_completed: !task.is_completed,
      });

      if (wasCompleted) {
        showInfo(
          'Task reopened',
          `"${task.title}" has been marked as incomplete.`
        );
      } else {
        showSuccess(
          'Task completed',
          `"${task.title}" has been marked as complete!`
        );
      }

      loadTasks();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      showError('Failed to update task', errorMessage);
    }
  };

  const handleTaskEdit = async (task: TaskListItem) => {
    try {
      // Load full task data from API
      const fullTask = await apiService.getTask(task.id);
      setEditingTask(fullTask);
      setShowTaskModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load task details';
      setError(errorMessage);
      showError('Failed to load task', errorMessage);
    }
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (editingTask) {
        await apiService.updateTask(editingTask.id, taskData);
        showSuccess('Task updated', 'Your task has been updated successfully.');
      } else {
        await apiService.createTask(taskData);
        showSuccess(
          'Task created',
          'Your new task has been created successfully.'
        );
      }

      setShowTaskModal(false);
      setEditingTask(null);
      setModalError(null);
      loadTasks();

      if (editingTask) {
        onTaskUpdate?.();
      } else {
        onTaskCreate?.();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save task';
      setModalError(errorMessage);
      showError('Failed to save task', errorMessage);
      throw err; // Re-throw to let the modal handle it
    } finally {
      setModalLoading(false);
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    setModalLoading(true);
    setModalError(null);

    try {
      await apiService.deleteTask(taskId);
      showSuccess('Task deleted', 'The task has been permanently deleted.');
      setShowTaskModal(false);
      setEditingTask(null);
      setModalError(null);
      loadTasks();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete task';
      setModalError(errorMessage);
      showError('Failed to delete task', errorMessage);
      throw err; // Re-throw to let the modal handle it
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7)
      return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString();
  };

  const TaskItem: React.FC<{ task: TaskListItem }> = ({ task }) => (
    <div className="group flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Completion Toggle */}
      <button
        onClick={() => handleTaskToggleComplete(task)}
        className={`flex-shrink-0 mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors ${
          task.is_completed
            ? 'text-green-600'
            : 'text-gray-400 hover:text-green-600'
        }`}
      >
        {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className={`text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors ${
                task.is_completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-900'
              }`}
              onClick={() => handleTaskEdit(task)}
            >
              {task.title}
            </h3>

            {/* Meta Information */}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {/* Priority */}
              {task.priority && (
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                    priorityConfig[task.priority].color
                  } ${priorityConfig[task.priority].bgColor} ${priorityConfig[task.priority].borderColor}`}
                >
                  <Flag size={12} className="mr-1" />
                  {priorityConfig[task.priority].label}
                </span>
              )}

              {/* Project */}
              {task.project && (
                <span
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: task.project.color }}
                >
                  <FolderOpen size={12} className="mr-1" />
                  {task.project.name}
                </span>
              )}

              {/* Labels */}
              {task.labels.map(label => (
                <span
                  key={label.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border"
                  style={{
                    backgroundColor: label.color + '20',
                    borderColor: label.color,
                    color: label.color,
                  }}
                >
                  {label.name}
                </span>
              ))}

              {/* Due Date */}
              {task.due_date && (
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    task.is_overdue
                      ? 'text-red-600 bg-red-100 border border-red-300'
                      : 'text-gray-600 bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Clock size={12} className="mr-1" />
                  {formatDate(task.due_date)}
                </span>
              )}

              {/* Subtasks Count */}
              {task.subtask_count > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-full">
                  {task.completed_subtask_count}/{task.subtask_count} subtasks
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <button className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">Loading...</p>
          </div>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-400 border border-transparent rounded-lg cursor-not-allowed"
          >
            <Plus size={16} className="mr-2" />
            New Task
          </button>
        </div>

        {/* Filters Bar Skeleton */}
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"
              />
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Task List Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <TaskSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tasks.length}{' '}
            {currentView === 'all'
              ? 'tasks'
              : viewFilters[
                  currentView as keyof typeof viewFilters
                ]?.label.toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          New Task
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-6 bg-white border-b border-gray-200">
        {/* View Filters */}
        <div className="flex items-center space-x-1 mb-4">
          {Object.entries(viewFilters).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <button
                key={key}
                onClick={() => setCurrentView(key)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === key
                    ? 'text-blue-700 bg-blue-100 border border-blue-300'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <IconComponent size={16} className="mr-2" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Search and Advanced Filters */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks... (Ctrl+F)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showFilters
                ? 'text-blue-700 bg-blue-100 border border-blue-300'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => showHelp(taskManagementShortcuts)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Keyboard shortcuts"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      priority: e.target.value as Priority,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="P1">P1 - Urgent</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                  <option value="P4">P4 - Low</option>
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={filters.project || ''}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      project: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtasks Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtasks
                </label>
                <select
                  value={filters.subtasks || ''}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      subtasks: e.target.value as 'include' | undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Hide subtasks</option>
                  <option value="include">Include subtasks</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <ErrorDisplay
            error={error}
            title="Failed to load tasks"
            showRetry={true}
            onRetry={loadTasks}
            onDismiss={() => setError(null)}
            className="mb-6"
            variant="banner"
          />
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Circle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ||
              Object.keys(filters).length > 0 ||
              currentView !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first task.'}
            </p>
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(tasks) &&
              tasks.map(task => <TaskItem key={task.id} task={task} />)}
            {(!Array.isArray(tasks) || tasks.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>No tasks found. Create your first task!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          task={editingTask}
          projects={projects}
          labels={labels}
          onSave={handleTaskSave}
          onCancel={() => {
            setShowTaskModal(false);
            setEditingTask(null);
            setModalError(null);
          }}
          onDelete={editingTask ? handleTaskDelete : undefined}
          loading={modalLoading}
          error={modalError}
          onClearError={() => setModalError(null)}
        />
      )}
    </div>
  );
};
