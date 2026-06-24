import React from 'react';
import { TaskListItem } from '../../types/task';
import { JournalEntryListItem } from '../../types/journal';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  tasksByDate: Record<string, TaskListItem[]>;
  entriesByDate?: Record<string, JournalEntryListItem[]>;
  onDayClick?: (dateKey: string) => void;
  onTaskClick?: (task: TaskListItem) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const priorityChipColor: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-blue-100 text-blue-700',
  P4: 'bg-gray-100 text-gray-700',
  '': 'bg-gray-100 text-gray-700',
};

const MAX_VISIBLE_TASKS = 3;

/** Format a Date as a local YYYY-MM-DD key (avoids UTC offset bugs). */
export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  tasksByDate,
  entriesByDate = {},
  onDayClick,
  onTaskClick,
}) => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday

  // Start the grid on the Sunday on or before the 1st.
  const gridStart = new Date(year, month, 1 - startOffset);

  const todayKey = toDateKey(new Date());

  // Build a 6-week (42-day) grid for a stable layout.
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === month;
          const isToday = key === todayKey;
          const dayTasks = tasksByDate[key] || [];
          const dayEntries = entriesByDate[key] || [];
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
          const overflow = dayTasks.length - visibleTasks.length;

          return (
            <div
              key={key}
              onClick={() => onDayClick?.(key)}
              className={`min-h-[110px] border-b border-r border-gray-200 p-1.5 flex flex-col cursor-pointer transition-colors hover:bg-gray-50 ${
                inMonth ? 'bg-white' : 'bg-gray-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : inMonth
                        ? 'text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayEntries.length > 0 && (
                  <span
                    className="h-2 w-2 rounded-full bg-purple-400"
                    title={`${dayEntries.length} journal ${dayEntries.length === 1 ? 'entry' : 'entries'}`}
                  />
                )}
              </div>

              <div className="space-y-1 overflow-hidden">
                {visibleTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={e => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                    className={`block w-full text-left truncate px-1.5 py-0.5 text-xs rounded ${
                      task.is_completed
                        ? 'bg-gray-100 text-gray-400 line-through'
                        : priorityChipColor[task.priority] ||
                          'bg-gray-100 text-gray-700'
                    }`}
                    style={
                      task.project && !task.is_completed
                        ? {
                            backgroundColor: task.project.color + '20',
                            color: task.project.color,
                          }
                        : undefined
                    }
                    title={task.title}
                  >
                    {task.title}
                  </button>
                ))}
                {overflow > 0 && (
                  <span className="block px-1.5 text-xs text-gray-500">
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
