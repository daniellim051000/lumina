import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Settings,
  Volume2,
  Zap,
  Save,
  Trash2,
  Star,
} from 'lucide-react';
import {
  PomodoroSettings,
  PomodoroSettingsUpdate,
  PomodoroPreset,
  PomodoroPresetData,
} from '../../types/pomodoro';
import { DurationInput } from './DurationInput';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  settings: PomodoroSettings | null;
  presets: PomodoroPreset[];
  onSave: (settings: PomodoroSettingsUpdate) => Promise<void>;
  onCancel: () => void;
  onSavePreset: (preset: PomodoroPresetData) => Promise<void>;
  onDeletePreset: (presetId: number) => Promise<void>;
  onApplyPreset: (presetId: number) => void;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          aria-label={label}
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-blue-600' : 'bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && onChange(!checked)}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </div>
      </div>
    </label>
  );
};

interface PresetSelectorProps {
  presets: PomodoroPreset[];
  onApply: (presetId: number) => void;
  onSave: () => void;
  onDelete: (presetId: number) => void;
  disabled?: boolean;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  onApply,
  onSave,
  onDelete,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {presets.map(preset => (
          <div
            key={preset.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              preset.is_default
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {preset.is_default && (
                <Star className="w-4 h-4 text-blue-500 fill-current" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {preset.name}
                </div>
                <div className="text-xs text-gray-500">
                  {preset.work_duration}m work, {preset.short_break_duration}m
                  break
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onApply(preset.id)}
                disabled={disabled}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => onDelete(preset.id)}
                disabled={disabled}
                aria-label={`Delete preset ${preset.name}`}
                className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center justify-center"
      >
        <Save className="w-4 h-4 mr-2" />
        Save as Preset
      </button>
    </div>
  );
};

export const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({
  isOpen,
  settings,
  presets,
  onSave,
  onCancel,
  onSavePreset,
  onDeletePreset,
  onApplyPreset,
  loading = false,
  error = null,
  onClearError,
}) => {
  const [formData, setFormData] = useState({
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sessions_until_long_break: 4,
    auto_start_breaks: false,
    auto_start_work: false,
    enable_audio: true,
    enable_notifications: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when settings change
  useEffect(() => {
    if (settings) {
      setFormData({
        work_duration: settings.work_duration,
        short_break_duration: settings.short_break_duration,
        long_break_duration: settings.long_break_duration,
        sessions_until_long_break: settings.sessions_until_long_break,
        auto_start_breaks: settings.auto_start_breaks,
        auto_start_work: settings.auto_start_work,
        enable_audio: settings.enable_audio,
        enable_notifications: settings.enable_notifications,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      // Error handling is done at parent level
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handlePresetApply = (presetId: number) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFormData({
        work_duration: preset.work_duration,
        short_break_duration: preset.short_break_duration,
        long_break_duration: preset.long_break_duration,
        sessions_until_long_break: preset.sessions_until_long_break,
        auto_start_breaks: formData.auto_start_breaks, // Keep existing automation settings
        auto_start_work: formData.auto_start_work,
        enable_audio: formData.enable_audio, // Keep existing sound settings
        enable_notifications: formData.enable_notifications,
      });
    }
    onApplyPreset(presetId);
  };

  const handleSavePreset = async () => {
    // For now, we'll use a simple prompt for the preset name
    // In a real implementation, this could be a separate modal or inline input
    const name = prompt('Enter preset name:');
    if (name && name.trim()) {
      const presetData: PomodoroPresetData = {
        name: name.trim(),
        work_duration: formData.work_duration,
        short_break_duration: formData.short_break_duration,
        long_break_duration: formData.long_break_duration,
        sessions_until_long_break: formData.sessions_until_long_break,
        is_default: false,
      };

      try {
        await onSavePreset(presetData);
      } catch (error) {
        // Error handling is done at parent level
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      tabIndex={-1}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Timer Settings
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close settings"
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
                title="Settings operation failed"
                onDismiss={onClearError}
                variant="inline"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Timer Durations Section */}
            <div>
              <h3 className="flex items-center text-sm font-medium text-gray-700 mb-4">
                <Clock className="w-4 h-4 mr-2" />
                Timer Durations
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DurationInput
                  label="Work Duration"
                  value={formData.work_duration}
                  min={1}
                  max={120}
                  suffix="minutes"
                  onChange={value =>
                    setFormData(prev => ({ ...prev, work_duration: value }))
                  }
                />
                <DurationInput
                  label="Short Break"
                  value={formData.short_break_duration}
                  min={1}
                  max={60}
                  suffix="minutes"
                  onChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      short_break_duration: value,
                    }))
                  }
                />
                <DurationInput
                  label="Long Break"
                  value={formData.long_break_duration}
                  min={1}
                  max={120}
                  suffix="minutes"
                  onChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      long_break_duration: value,
                    }))
                  }
                />
                <DurationInput
                  label="Sessions Until Long Break"
                  value={formData.sessions_until_long_break}
                  min={2}
                  max={12}
                  onChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      sessions_until_long_break: value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Auto-start Settings */}
            <div>
              <h3 className="flex items-center text-sm font-medium text-gray-700 mb-4">
                <Zap className="w-4 h-4 mr-2" />
                Automation
              </h3>
              <div className="space-y-3">
                <ToggleSwitch
                  checked={formData.auto_start_breaks}
                  onChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      auto_start_breaks: checked,
                    }))
                  }
                  label="Auto-start break sessions"
                  disabled={loading || isSubmitting}
                />
                <ToggleSwitch
                  checked={formData.auto_start_work}
                  onChange={checked =>
                    setFormData(prev => ({ ...prev, auto_start_work: checked }))
                  }
                  label="Auto-start work sessions"
                  disabled={loading || isSubmitting}
                />
              </div>
            </div>

            {/* Sound & Notifications */}
            <div>
              <h3 className="flex items-center text-sm font-medium text-gray-700 mb-4">
                <Volume2 className="w-4 h-4 mr-2" />
                Sound & Notifications
              </h3>
              <div className="space-y-3">
                <ToggleSwitch
                  checked={formData.enable_audio}
                  onChange={checked =>
                    setFormData(prev => ({ ...prev, enable_audio: checked }))
                  }
                  label="Enable sound"
                  disabled={loading || isSubmitting}
                />
                <ToggleSwitch
                  checked={formData.enable_notifications}
                  onChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      enable_notifications: checked,
                    }))
                  }
                  label="Enable notifications"
                  disabled={loading || isSubmitting}
                />
              </div>
            </div>

            {/* Presets Section */}
            <div>
              <h3 className="flex items-center text-sm font-medium text-gray-700 mb-4">
                <Settings className="w-4 h-4 mr-2" />
                Presets
              </h3>
              <PresetSelector
                presets={presets}
                onApply={handlePresetApply}
                onSave={handleSavePreset}
                onDelete={onDeletePreset}
                disabled={loading || isSubmitting}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center p-6 bg-gray-50 border-t border-gray-200 space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {(loading || isSubmitting) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {loading || isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
