/**
 * TimerDisplay component - Shows the countdown timer with circular progress
 */

import React from 'react';
import { PomodoroSessionType } from '../../types/pomodoro';

interface TimerDisplayProps {
  timeRemaining: number; // in seconds
  totalDuration: number; // in seconds
  sessionType: PomodoroSessionType;
  isRunning: boolean;
  isPaused: boolean;
  formatTime: (seconds: number) => string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  totalDuration,
  sessionType,
  isRunning,
  isPaused,
  formatTime,
}) => {
  // Calculate progress percentage
  const progress =
    totalDuration > 0
      ? ((totalDuration - timeRemaining) / totalDuration) * 100
      : 0;

  // Get colors based on session type
  const getSessionColors = () => {
    switch (sessionType) {
      case 'work':
        return {
          primary: '#3B82F6', // blue-500
          secondary: '#DBEAFE', // blue-100
          background: '#EFF6FF', // blue-50
          text: '#1E40AF', // blue-700
        };
      case 'short_break':
        return {
          primary: '#10B981', // green-500
          secondary: '#D1FAE5', // green-100
          background: '#ECFDF5', // green-50
          text: '#047857', // green-700
        };
      case 'long_break':
        return {
          primary: '#8B5CF6', // purple-500
          secondary: '#E9D5FF', // purple-100
          background: '#F5F3FF', // purple-50
          text: '#6D28D9', // purple-700
        };
      default:
        return {
          primary: '#6B7280', // gray-500
          secondary: '#F3F4F6', // gray-100
          background: '#F9FAFB', // gray-50
          text: '#374151', // gray-700
        };
    }
  };

  const colors = getSessionColors();

  // Get session type display name
  const getSessionName = () => {
    switch (sessionType) {
      case 'work':
        return 'Focus Time';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Timer';
    }
  };

  // Get status text
  const getStatusText = () => {
    if (isPaused) return 'Paused';
    if (isRunning) return 'Running';
    return 'Ready';
  };

  // SVG circle properties
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Circular Progress */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-50"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-in-out"
            style={{
              filter: isRunning
                ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))'
                : 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Timer display */}
          <div
            className="text-6xl font-mono font-bold mb-2"
            style={{ color: colors.text }}
          >
            {formatTime(timeRemaining)}
          </div>

          {/* Session type */}
          <div
            className="text-lg font-medium mb-1"
            style={{ color: colors.text }}
          >
            {getSessionName()}
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'animate-pulse' : isPaused ? 'animate-bounce' : ''
              }`}
              style={{
                backgroundColor: isRunning
                  ? colors.primary
                  : isPaused
                    ? '#F59E0B' // amber-500
                    : '#9CA3AF', // gray-400
              }}
            />
            <span className="text-sm font-medium text-gray-600">
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar (alternative/additional display) */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-1000 ease-in-out"
            style={{
              width: `${progress}%`,
              backgroundColor: colors.primary,
            }}
          />
        </div>
      </div>

      {/* Session info */}
      <div className="text-center space-y-1">
        <div className="text-sm text-gray-600">
          Total Duration: {formatTime(totalDuration)}
        </div>
        <div className="text-xs text-gray-500">
          Remaining: {formatTime(timeRemaining)}
        </div>
      </div>
    </div>
  );
};
