import React, { useState } from 'react';
import { Task, TaskFilters, TaskStatus } from '../types/task';
import { mockTasks } from '../data/mockTasks';
import { TaskList } from '../components/TaskList';
import { TaskFiltersComponent } from '../components/TaskFilters';
import { TaskForm } from '../components/TaskForm';
import { isDateOverdue } from '../utils/dateHelpers';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const availableProjects = Array.from(
    new Set(tasks.map(task => task.project).filter(Boolean))
  ) as string[];

  const handleToggleComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status:
                task.status === TaskStatus.COMPLETED
                  ? TaskStatus.TODO
                  : TaskStatus.COMPLETED,
              updatedAt: new Date(),
            }
          : task
      )
    );
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const handleSave = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date();

    if (editingTask) {
      // Update existing task
      setTasks(prev =>
        prev.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                ...taskData,
                updatedAt: now,
              }
            : task
        )
      );
      setEditingTask(null);
    } else {
      // Create new task
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      setTasks(prev => [newTask, ...prev]);
      setShowCreateForm(false);
    }
  };

  const handleCancel = () => {
    setEditingTask(null);
    setShowCreateForm(false);
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    pending: tasks.filter(t => t.status !== TaskStatus.COMPLETED).length,
    overdue: tasks.filter(
      t => isDateOverdue(t.dueDate) && t.status !== TaskStatus.COMPLETED
    ).length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your tasks and stay organized
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Create Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-2xl font-bold text-gray-900">
            {taskStats.total}
          </div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            {taskStats.completed}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">
            {taskStats.pending}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">
            {taskStats.overdue}
          </div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <TaskFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        availableProjects={availableProjects}
      />

      {/* Task List */}
      <TaskList
        tasks={tasks}
        filters={filters}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Task Form Modal */}
      {(editingTask || showCreateForm) && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onCancel={handleCancel}
          availableProjects={availableProjects}
        />
      )}
    </div>
  );
};
