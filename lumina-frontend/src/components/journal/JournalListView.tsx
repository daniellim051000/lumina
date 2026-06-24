import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  JournalEntry,
  JournalEntryListItem,
  JournalFilters,
  Mood,
} from '../../types/journal';
import { apiService } from '../../services/api';
import { JournalEntryModal } from './JournalEntryModal';
import { TaskSkeleton } from '../ui/TaskSkeleton';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { useToast } from '../../contexts/ToastContext';

interface JournalListViewProps {
  onEntryCreate?: () => void;
  onEntryUpdate?: () => void;
}

const moodDisplay: Record<Exclude<Mood, ''>, { emoji: string; label: string }> =
  {
    great: { emoji: '😄', label: 'Great' },
    good: { emoji: '🙂', label: 'Good' },
    okay: { emoji: '😐', label: 'Okay' },
    bad: { emoji: '🙁', label: 'Bad' },
    awful: { emoji: '😢', label: 'Awful' },
  };

export const JournalListView: React.FC<JournalListViewProps> = ({
  onEntryCreate,
  onEntryUpdate,
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [entries, setEntries] = useState<JournalEntryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<Mood>('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const filters: JournalFilters = {};
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (moodFilter) filters.mood = moodFilter;

      const data = await apiService.getJournalEntries(filters);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, moodFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleEntryEdit = async (entry: JournalEntryListItem) => {
    try {
      const fullEntry = await apiService.getJournalEntry(entry.id);
      setEditingEntry(fullEntry);
      setShowModal(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load entry details';
      setError(message);
      showError('Failed to load entry', message);
    }
  };

  const handleEntrySave = async (entryData: Partial<JournalEntry>) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (editingEntry) {
        await apiService.updateJournalEntry(editingEntry.id, entryData);
        showSuccess('Entry updated', 'Your journal entry has been updated.');
      } else {
        await apiService.createJournalEntry(entryData);
        showSuccess('Entry created', 'Your journal entry has been created.');
      }

      setShowModal(false);
      setEditingEntry(null);
      setModalError(null);
      loadEntries();

      if (editingEntry) {
        onEntryUpdate?.();
      } else {
        onEntryCreate?.();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save entry';
      setModalError(message);
      showError('Failed to save entry', message);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleEntryDelete = async (entryId: number) => {
    setModalLoading(true);
    setModalError(null);

    try {
      await apiService.deleteJournalEntry(entryId);
      showSuccess('Entry deleted', 'The journal entry has been deleted.');
      setShowModal(false);
      setEditingEntry(null);
      setModalError(null);
      loadEntries();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete entry';
      setModalError(message);
      showError('Failed to delete entry', message);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const EntryCard: React.FC<{ entry: JournalEntryListItem }> = ({ entry }) => (
    <button
      onClick={() => handleEntryEdit(entry)}
      className="w-full text-left group p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {entry.title}
        </h3>
        {entry.mood && (
          <span className="ml-2 flex-shrink-0 text-base" title={moodDisplay[entry.mood]?.label}>
            {moodDisplay[entry.mood]?.emoji}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">{formatDate(entry.date)}</p>
      {entry.content_preview && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {entry.content_preview}
        </p>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('journal.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('app.loading')}</p>
          </div>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-400 border border-transparent rounded-lg cursor-not-allowed"
          >
            <Plus size={16} className="mr-2" />
            {t('journal.newEntry')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <TaskSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('journal.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('journal.entryCount', { count: entries.length })}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEntry(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          {t('journal.newEntry')}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('journal.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={moodFilter}
            onChange={e => setMoodFilter(e.target.value as Mood)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('journal.allMoods')}</option>
            <option value="great">😄 Great</option>
            <option value="good">🙂 Good</option>
            <option value="okay">😐 Okay</option>
            <option value="bad">🙁 Bad</option>
            <option value="awful">😢 Awful</option>
          </select>
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <ErrorDisplay
            error={error}
            title="Failed to load journal"
            showRetry={true}
            onRetry={loadEntries}
            onDismiss={() => setError(null)}
            className="mb-6"
            variant="banner"
          />
        )}

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('journal.noEntriesTitle')}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || moodFilter
                ? t('journal.noEntriesFiltered')
                : t('journal.noEntriesEmpty')}
            </p>
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              {t('journal.newEntry')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <JournalEntryModal
          isOpen={showModal}
          entry={editingEntry}
          onSave={handleEntrySave}
          onCancel={() => {
            setShowModal(false);
            setEditingEntry(null);
            setModalError(null);
          }}
          onDelete={editingEntry ? handleEntryDelete : undefined}
          loading={modalLoading}
          error={modalError}
          onClearError={() => setModalError(null)}
        />
      )}
    </div>
  );
};
