import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Flag,
  Hash,
  FolderOpen,
  AlignLeft,
  FileText,
} from 'lucide-react';
import {
  Task,
  Priority,
  Project,
  Label,
  TaskQuickCreate,
} from '../../types/task';
import {
  useKeyboardShortcuts,
  createModalShortcuts,
} from '../../hooks/useKeyboardShortcuts';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  projects: Project[];
  labels: Label[];
  onSave: (taskData: Partial<Task> | TaskQuickCreate) => Promise<void>;
  onCancel: () => void;
  onDelete?: (taskId: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const priorityColors = {
  P1: 'text-red-600 bg-red-50 border-red-200',
  P2: 'text-orange-600 bg-orange-50 border-orange-200',
  P3: 'text-blue-600 bg-blue-50 border-blue-200',
  P4: 'text-gray-600 bg-gray-50 border-gray-200',
  '': 'text-gray-500 bg-gray-50 border-gray-200',
};

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  projects,
  labels,
  onSave,
  onCancel,
  onDelete,
  loading = false,
  error = null,
  onClearError,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    priority: '' as Priority,
    date: '',
    due_date: '',
    project_id: undefined as number | undefined,
    label_ids: [] as number[],
    is_completed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        priority: task.priority,
        date: task.date || '',
        due_date: task.due_date || '',
        project_id: task.project?.id,
        label_ids: task.labels.map(label => label.id),
        is_completed: task.is_completed,
      });
    } else {
      // Reset form for new task
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        notes: '',
        priority: '',
        date: today,
        due_date: today,
        project_id: undefined,
        label_ids: [],
        is_completed: false,
      });
    }
  }, [task, isOpen]);

  // Keyboard shortcuts for modal
  const modalShortcuts = createModalShortcuts({
    save: () => {
      const form = document.querySelector('form');
      if (form && 'requestSubmit' in form) {
        (form as { requestSubmit: () => void }).requestSubmit();
      }
    },
    cancel: onCancel,
  });

  useKeyboardShortcuts(modalShortcuts, isOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || isSubmitting) return;

    const taskData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      date: formData.date || undefined,
      due_date: formData.due_date || undefined,
      label_ids: formData.label_ids.length > 0 ? formData.label_ids : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSave(taskData);
    } catch (error) {
      // Error handling is done at parent level
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabelToggle = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      label_ids: prev.label_ids.includes(labelId)
        ? prev.label_ids.filter(id => id !== labelId)
        : [...prev.label_ids, labelId],
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as React.FormEvent);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full max-h-[calc(90vh-80px)]"
        >
          {/* Error Display */}
          {error && (
            <div className="p-4 border-b border-gray-200">
              <ErrorDisplay
                error={error}
                title="Task operation failed"
                onDismiss={onClearError}
                variant="inline"
              />
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <AlignLeft size={16} className="mr-2" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add a description..."
              />
            </div>

            {/* Rich Notes Section (Notion-inspired) */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="mr-2" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add detailed notes, ideas, or additional context..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Rich notes section for detailed information, similar to Notion
              </p>
            </div>

            {/* Priority and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Flag size={16} className="mr-2" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      priority: e.target.value as Priority,
                    }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    priorityColors[formData.priority]
                  }`}
                >
                  <option value="">No Priority</option>
                  <option value="P1">P1 - Urgent</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                  <option value="P4">P4 - Low</option>
                </select>
              </div>

              {/* Work Date */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="mr-2" />
                  Work Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="mr-2" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, due_date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FolderOpen size={16} className="mr-2" />
                Project
              </label>
              <select
                value={formData.project_id || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    project_id: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Labels */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Hash size={16} className="mr-2" />
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleLabelToggle(label.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      formData.label_ids.includes(label.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: formData.label_ids.includes(label.id)
                        ? label.color + '20'
                        : undefined,
                      borderColor: formData.label_ids.includes(label.id)
                        ? label.color
                        : undefined,
                      color: formData.label_ids.includes(label.id)
                        ? label.color
                        : undefined,
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
              {labels.length === 0 && (
                <p className="text-sm text-gray-500">No labels available</p>
              )}
            </div>

            {/* Completion Status */}
            {task && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="completed"
                  checked={formData.is_completed}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      is_completed: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="completed"
                  className="ml-2 text-sm text-gray-700"
                >
                  Mark as completed
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {task && onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (onDelete) {
                      setIsSubmitting(true);
                      try {
                        await onDelete(task.id);
                      } catch (error) {
                        // Error handling is done at parent level
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  disabled={loading || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  {isSubmitting ? 'Deleting...' : 'Delete Task'}
                </button>
              )}
              <div className="text-xs text-gray-500">
                Press <kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd>{' '}
                to close,{' '}
                <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+Enter</kbd>{' '}
                to save
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim() || loading || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {(loading || isSubmitting) && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                {loading || isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
