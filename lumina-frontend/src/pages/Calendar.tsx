import React, { useState, useEffect, useCallback } from 'react';
import { TaskListItem, Task, Project, Label } from '../types/task';
import { JournalEntryListItem } from '../types/journal';
import { apiService } from '../services/api';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { CalendarGrid, toDateKey } from '../components/calendar/CalendarGrid';
import { TaskModal } from '../components/task/TaskModal';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import { useToast } from '../contexts/ToastContext';

/** Group items into a map keyed by both their work date and due date. */
const groupTasksByDate = (
  tasks: TaskListItem[]
): Record<string, TaskListItem[]> => {
  const map: Record<string, TaskListItem[]> = {};
  const push = (key: string | undefined, task: TaskListItem) => {
    if (!key) return;
    if (!map[key]) map[key] = [];
    if (!map[key].some(t => t.id === task.id)) map[key].push(task);
  };
  tasks.forEach(task => {
    push(task.date, task);
    push(task.due_date, task);
  });
  return map;
};

const groupEntriesByDate = (
  entries: JournalEntryListItem[]
): Record<string, JournalEntryListItem[]> => {
  const map: Record<string, JournalEntryListItem[]> = {};
  entries.forEach(entry => {
    if (!map[entry.date]) map[entry.date] = [];
    map[entry.date].push(entry);
  });
  return map;
};

export const CalendarPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [anchor, setAnchor] = useState(() => new Date());
  const [tasksByDate, setTasksByDate] = useState<
    Record<string, TaskListItem[]>
  >({});
  const [entriesByDate, setEntriesByDate] = useState<
    Record<string, JournalEntryListItem[]>
  >({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const loadMonth = useCallback(async () => {
    try {
      // Cover the full visible grid, including leading/trailing edge days.
      const gridStart = new Date(year, month, 1 - new Date(year, month, 1).getDay());
      const gridEnd = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + 41
      );

      const [tasks, entries] = await Promise.all([
        apiService.getTasks({
          date_from: toDateKey(gridStart),
          date_to: toDateKey(gridEnd),
          subtasks: 'include',
        }),
        apiService.getJournalEntries({
          date_from: toDateKey(gridStart),
          date_to: toDateKey(gridEnd),
        }),
      ]);

      setTasksByDate(groupTasksByDate(tasks));
      setEntriesByDate(groupEntriesByDate(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    }
  }, [year, month]);

  const loadMeta = useCallback(async () => {
    try {
      const [projectsData, labelsData] = await Promise.all([
        apiService.getProjects(),
        apiService.getLabels(),
      ]);
      setProjects(projectsData);
      setLabels(labelsData);
    } catch {
      // Non-fatal: the calendar still renders without project/label metadata.
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const handleTaskClick = async (task: TaskListItem) => {
    try {
      const fullTask = await apiService.getTask(task.id);
      setEditingTask(fullTask);
      setShowTaskModal(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load task details';
      setError(message);
      showError('Failed to load task', message);
    }
  };

  const handleDayClick = () => {
    // Open a blank task creation modal.
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (editingTask) {
        await apiService.updateTask(editingTask.id, taskData);
        showSuccess('Task updated', 'Your task has been updated.');
      } else {
        await apiService.createTask(taskData);
        showSuccess('Task created', 'Your task has been created.');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      loadMonth();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save task';
      setModalError(message);
      showError('Failed to save task', message);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await apiService.deleteTask(taskId);
      showSuccess('Task deleted', 'The task has been deleted.');
      setShowTaskModal(false);
      setEditingTask(null);
      loadMonth();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete task';
      setModalError(message);
      showError('Failed to delete task', message);
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <CalendarHeader
          year={year}
          month={month}
          onPrev={() => setAnchor(new Date(year, month - 1, 1))}
          onNext={() => setAnchor(new Date(year, month + 1, 1))}
          onToday={() => setAnchor(new Date())}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <ErrorDisplay
            error={error}
            title="Failed to load calendar"
            showRetry={true}
            onRetry={loadMonth}
            onDismiss={() => setError(null)}
            className="mb-6"
            variant="banner"
          />
        )}

        <CalendarGrid
          year={year}
          month={month}
          tasksByDate={tasksByDate}
          entriesByDate={entriesByDate}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
        />
      </div>

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
