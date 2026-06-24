import React, { useState, useEffect } from 'react';
import { X, Calendar, Smile, FileText } from 'lucide-react';
import { JournalEntry, Mood } from '../../types/journal';
import {
  useKeyboardShortcuts,
  createModalShortcuts,
} from '../../hooks/useKeyboardShortcuts';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface JournalEntryModalProps {
  isOpen: boolean;
  entry?: JournalEntry | null;
  onSave: (entryData: Partial<JournalEntry>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (entryId: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const moodOptions: { value: Mood; label: string }[] = [
  { value: '', label: 'No mood' },
  { value: 'great', label: '😄 Great' },
  { value: 'good', label: '🙂 Good' },
  { value: 'okay', label: '😐 Okay' },
  { value: 'bad', label: '🙁 Bad' },
  { value: 'awful', label: '😢 Awful' },
];

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  entry,
  onSave,
  onCancel,
  onDelete,
  loading = false,
  error = null,
  onClearError,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '' as Mood,
    date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        content: entry.content || '',
        mood: entry.mood,
        date: entry.date || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ title: '', content: '', mood: '', date: today });
    }
  }, [entry, isOpen]);

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

    const entryData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      mood: formData.mood,
      date: formData.date || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSave(entryData);
    } catch {
      // Error handling is done at parent level
    } finally {
      setIsSubmitting(false);
    }
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
            {entry ? 'Edit Entry' : 'New Journal Entry'}
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
          {error && (
            <div className="p-4 border-b border-gray-200">
              <ErrorDisplay
                error={error}
                title="Journal operation failed"
                onDismiss={onClearError}
                variant="inline"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's on your mind?"
                autoFocus
              />
            </div>

            {/* Date and Mood */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="mr-2" />
                  Date
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

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Smile size={16} className="mr-2" />
                  Mood
                </label>
                <select
                  value={formData.mood}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      mood: e.target.value as Mood,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {moodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="mr-2" />
                Entry
              </label>
              <textarea
                value={formData.content}
                onChange={e =>
                  setFormData(prev => ({ ...prev, content: e.target.value }))
                }
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write your thoughts..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {entry && onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (onDelete) {
                      setIsSubmitting(true);
                      try {
                        await onDelete(entry.id);
                      } catch {
                        // Error handling is done at parent level
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  disabled={loading || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  {isSubmitting ? 'Deleting...' : 'Delete Entry'}
                </button>
              )}
              <div className="text-xs text-gray-500">
                Press <kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd> to
                close,{' '}
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
                {loading || isSubmitting
                  ? 'Saving...'
                  : entry
                    ? 'Update Entry'
                    : 'Create Entry'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
