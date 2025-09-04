import React from 'react';
import { Link } from 'react-router-dom';
import { mockTasks } from '../data/mockTasks';
import { TaskStatus } from '../types/task';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const todaysTasks = mockTasks.filter(task => {
    if (task.status === TaskStatus.COMPLETED) return false;
    if (!task.dueDate) return false;

    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today.toDateString();
  });

  const upcomingTasks = mockTasks
    .filter(task => {
      if (task.status === TaskStatus.COMPLETED) return false;
      if (!task.dueDate) return false;

      const today = new Date();
      const taskDate = new Date(task.dueDate);
      return taskDate > today;
    })
    .slice(0, 5);

  const recentlyCompleted = mockTasks
    .filter(task => task.status === TaskStatus.COMPLETED)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);

  const stats = {
    total: mockTasks.length,
    completed: mockTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    inProgress: mockTasks.filter(t => t.status === TaskStatus.IN_PROGRESS)
      .length,
    overdue: mockTasks.filter(
      t =>
        t.dueDate && new Date() > t.dueDate && t.status !== TaskStatus.COMPLETED
    ).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Good morning! 👋</h1>
        <p className="text-lg text-gray-600 mt-2">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📋</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🔄</div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.inProgress}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Today's Tasks ({todaysTasks.length})
                </h2>
                <Link
                  to="/tasks"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all →
                </Link>
              </div>
            </div>

            <div className="p-6">
              {todaysTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-gray-600">
                    No tasks due today. Great job!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {task.priority}
                          </span>
                          {task.project && (
                            <span className="text-xs text-gray-600">
                              • {task.project}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Due {format(new Date(task.dueDate!), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/tasks"
                className="flex items-center p-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg mr-3">➕</span>
                Create new task
              </Link>
              <Link
                to="/timer"
                className="flex items-center p-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg mr-3">⏰</span>
                Start focus timer
              </Link>
              <Link
                to="/journal"
                className="flex items-center p-3 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg mr-3">📖</span>
                Write journal entry
              </Link>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming
            </h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-600">No upcoming tasks</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {task.project}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(task.dueDate!), 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Completed */}
          {recentlyCompleted.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recently Completed
              </h3>
              <div className="space-y-3">
                {recentlyCompleted.map(task => (
                  <div key={task.id} className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 line-through">
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {format(task.updatedAt, 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
