/**
 * PomodoroTimer page component - Main Pomodoro timer interface
 */

import React, { useState, useEffect } from 'react';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls } from '../components/timer/TimerControls';
import { PomodoroSettingsModal } from '../components/timer/PomodoroSettingsModal';
import {
  PomodoroSessionType,
  PomodoroPreset,
  PomodoroSettingsUpdate,
  PomodoroPresetData,
} from '../types/pomodoro';
import { apiService } from '../services/api';

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
    loadSettings, // Method to refresh settings from API
  } = usePomodoroTimer();

  const [showSettings, setShowSettings] = useState(false);
  const [presets, setPresets] = useState<PomodoroPreset[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Load presets when component mounts or when settings modal opens
  useEffect(() => {
    if (showSettings) {
      loadPresets();
    }
  }, [showSettings]);

  const loadPresets = async () => {
    try {
      const presetsData = await apiService.getPomodoroPresets();
      setPresets(presetsData);
    } catch (error) {
      console.error('Failed to load presets:', error);
      setSettingsError('Failed to load presets');
    }
  };

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
    setSettingsError(null);
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setSettingsError(null);
  };

  const handleSaveSettings = async (settingsData: PomodoroSettingsUpdate) => {
    setSettingsLoading(true);
    setSettingsError(null);

    try {
      await apiService.updatePomodoroSettings(settingsData);
      // Refresh settings from the hook to update the timer
      await loadSettings();
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSettingsError(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSavePreset = async (presetData: PomodoroPresetData) => {
    try {
      await apiService.createPomodoroPreset(presetData);
      // Reload presets to show the new one
      await loadPresets();
    } catch (error) {
      console.error('Failed to save preset:', error);
      setSettingsError(
        error instanceof Error ? error.message : 'Failed to save preset'
      );
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    try {
      await apiService.deletePomodoroPreset(presetId);
      // Reload presets to remove the deleted one
      await loadPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
      setSettingsError(
        error instanceof Error ? error.message : 'Failed to delete preset'
      );
    }
  };

  const handleApplyPreset = (presetId: number) => {
    // This handler is called when a preset is applied - it updates the form data in the modal
    // The actual API call to apply the preset to settings is handled separately
    console.log('Applied preset:', presetId);
  };

  const handleClearError = () => {
    setSettingsError(null);
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

      {/* Settings Modal */}
      <PomodoroSettingsModal
        isOpen={showSettings}
        settings={settings}
        presets={presets}
        onSave={handleSaveSettings}
        onCancel={handleCloseSettings}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onApplyPreset={handleApplyPreset}
        loading={settingsLoading}
        error={settingsError}
        onClearError={handleClearError}
      />
    </div>
  );
};
