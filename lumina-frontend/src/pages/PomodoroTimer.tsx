/**
 * PomodoroTimer page component - Main Pomodoro timer interface
 */

import React, { useState } from 'react';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls } from '../components/timer/TimerControls';
import { PomodoroSessionType } from '../types/pomodoro';

export const PomodoroTimer: React.FC = () => {
  const {
    timerState,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    skipTimer,
    stopTimer,
    isLoading,
    error,
    formatTime,
    canStartTimer,
  } = usePomodoroTimer();

  const [showSettings, setShowSettings] = useState(false);

  // Get total duration for the current session
  const getTotalDuration = (): number => {
    if (!settings) return 25 * 60; // Default 25 minutes in seconds

    switch (timerState.sessionType) {
      case 'work':
        return settings.work_duration * 60;
      case 'short_break':
        return settings.short_break_duration * 60;
      case 'long_break':
        return settings.long_break_duration * 60;
      default:
        return 25 * 60;
    }
  };

  // Handle timer reset (reset session number to 1)
  const handleReset = () => {
    // For now, this is just a UI reset
    // In a full implementation, you might want to add an API endpoint for this
    console.log('Reset timer to session 1');
  };

  // Handle settings modal
  const handleSettings = () => {
    setShowSettings(true);
  };

  // Get background color based on session type
  const getBackgroundColor = () => {
    switch (timerState.sessionType) {
      case 'work':
        return 'bg-gradient-to-br from-blue-50 to-blue-100';
      case 'short_break':
        return 'bg-gradient-to-br from-green-50 to-green-100';
      case 'long_break':
        return 'bg-gradient-to-br from-purple-50 to-purple-100';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100';
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${getBackgroundColor()}`}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Focus Timer</h1>
          <p className="text-lg text-gray-600">
            Stay focused with the Pomodoro Technique
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <span className="font-medium">Error:</span>
              <span className="ml-2">{error}</span>
            </div>
          </div>
        )}

        {/* Loading state for initial settings load */}
        {!settings && isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading timer settings...</span>
            </div>
          </div>
        )}

        {/* Main timer interface */}
        {settings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Timer Display */}
            <div className="flex justify-center">
              <TimerDisplay
                timeRemaining={timerState.timeRemaining}
                totalDuration={getTotalDuration()}
                sessionType={timerState.sessionType}
                isRunning={timerState.isRunning}
                isPaused={timerState.isPaused}
                formatTime={formatTime}
              />
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center">
              <TimerControls
                isRunning={timerState.isRunning}
                isPaused={timerState.isPaused}
                canStartTimer={canStartTimer}
                isLoading={isLoading}
                sessionType={timerState.sessionType}
                sessionNumber={timerState.sessionNumber}
                onStart={(sessionType?: PomodoroSessionType) =>
                  startTimer(sessionType)
                }
                onPause={pauseTimer}
                onResume={resumeTimer}
                onSkip={skipTimer}
                onStop={stopTimer}
                onSettings={handleSettings}
                onReset={handleReset}
              />
            </div>
          </div>
        )}

        {/* Session Statistics */}
        {settings && (
          <div className="mt-12">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Session
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {timerState.sessionNumber}
                  </div>
                  <div className="text-sm text-gray-600">Session</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {settings.sessions_until_long_break}
                  </div>
                  <div className="text-sm text-gray-600">Until Long Break</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {timerState.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600">Total Today</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatTime(getTotalDuration())}
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips and Information */}
        <div className="mt-12">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pomodoro Technique
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  How it works:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Work for 25 minutes with full focus</li>
                  <li>• Take a 5-minute break</li>
                  <li>• After 4 sessions, take a 15-30 minute break</li>
                  <li>• Repeat the cycle</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Improves focus and concentration</li>
                  <li>• Reduces mental fatigue</li>
                  <li>• Enhances productivity</li>
                  <li>• Prevents burnout</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-xs text-gray-500">
            <span>⏎ Start/Pause</span>
            <span>⎵ Skip</span>
            <span>⌘S Settings</span>
          </div>
        </div>
      </div>

      {/* Settings Modal Placeholder */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Timer Settings</h3>
            <p className="text-gray-600 mb-4">
              Settings modal coming soon! You can adjust work duration, break
              duration, and other preferences here.
            </p>
            <button
              onClick={() => setShowSettings(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
