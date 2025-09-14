/**
 * TimerControls component - Control buttons for the Pomodoro timer
 */

import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { PomodoroSessionType } from '../../types/pomodoro';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  canStartTimer: boolean;
  isLoading: boolean;
  sessionType: PomodoroSessionType;
  sessionNumber: number;

  // Control handlers
  onStart: (sessionType?: PomodoroSessionType) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
  onSettings: () => void;
  onReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  canStartTimer,
  isLoading,
  sessionType,
  sessionNumber,
  onStart,
  onPause,
  onResume,
  onSkip,
  onStop,
  onSettings,
  onReset,
}) => {
  // Get next session type for the start button
  const getNextSessionLabel = () => {
    if (sessionType === 'work') {
      return sessionNumber >= 4 ? 'Long Break' : 'Short Break';
    }
    return 'Focus Time';
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main control button */}
      <div className="flex justify-center">
        {!isRunning && !isPaused ? (
          // Start button
          <button
            onClick={() => onStart('work')}
            disabled={!canStartTimer || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full flex items-center space-x-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Play size={24} />
            <span>Start Timer</span>
          </button>
        ) : isPaused ? (
          // Resume button
          <button
            onClick={onResume}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full flex items-center space-x-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Play size={24} />
            <span>Resume</span>
          </button>
        ) : (
          // Pause button
          <button
            onClick={onPause}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full flex items-center space-x-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Pause size={24} />
            <span>Pause</span>
          </button>
        )}
      </div>

      {/* Secondary controls */}
      <div className="flex items-center space-x-4">
        {/* Skip button - only show when timer is active */}
        {(isRunning || isPaused) && (
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="bg-orange-100 hover:bg-orange-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-orange-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
            title="Skip current session"
          >
            <SkipForward size={18} />
            <span>Skip</span>
          </button>
        )}

        {/* Stop button - only show when timer is active */}
        {(isRunning || isPaused) && (
          <button
            onClick={onStop}
            disabled={isLoading}
            className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-red-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
            title="Stop and cancel current session"
          >
            <Square size={18} />
            <span>Stop</span>
          </button>
        )}

        {/* Reset button - only show when timer is not active */}
        {!isRunning && !isPaused && (
          <button
            onClick={onReset}
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
            title="Reset to session 1"
          >
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Quick start buttons */}
      {canStartTimer && !isRunning && !isPaused && (
        <div className="flex flex-col items-center space-y-3">
          <div className="text-sm font-medium text-gray-600">Quick Start:</div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onStart('work')}
              disabled={isLoading}
              className="bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-blue-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
            >
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Work</span>
            </button>

            <button
              onClick={() => onStart('short_break')}
              disabled={isLoading}
              className="bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-green-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Short Break</span>
            </button>

            <button
              onClick={() => onStart('long_break')}
              disabled={isLoading}
              className="bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-purple-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
            >
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Long Break</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings button */}
      <div className="flex justify-center">
        <button
          onClick={onSettings}
          disabled={isLoading}
          className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>

      {/* Session info */}
      <div className="text-center space-y-1">
        <div className="text-sm font-medium text-gray-700">
          Session {sessionNumber}
        </div>
        <div className="text-xs text-gray-500">
          {!isRunning && !isPaused && `Next: ${getNextSessionLabel()}`}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm">Processing...</span>
        </div>
      )}
    </div>
  );
};
