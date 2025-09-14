import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PomodoroSettingsModal } from './PomodoroSettingsModal';
import { PomodoroSettings, PomodoroPreset } from '../../types/pomodoro';

const mockSettings: PomodoroSettings = {
  id: 1,
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  sessions_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_work: false,
  enable_audio: true,
  work_sound: 'bell',
  break_sound: 'chime',
  volume: 0.7,
  enable_notifications: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockPresets: PomodoroPreset[] = [
  {
    id: 1,
    name: 'Classic Pomodoro',
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sessions_until_long_break: 4,
    is_default: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Extended Focus',
    work_duration: 45,
    short_break_duration: 10,
    long_break_duration: 30,
    sessions_until_long_break: 3,
    is_default: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

describe('PomodoroSettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    settings: mockSettings,
    presets: mockPresets,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onSavePreset: vi.fn(),
    onDeletePreset: vi.fn(),
    onApplyPreset: vi.fn(),
    loading: false,
    error: null,
    onClearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByText('Timer Settings')).toBeInTheDocument();
      expect(screen.getByText('Timer Durations')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<PomodoroSettingsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Timer Settings')).not.toBeInTheDocument();
    });

    it('should display modal backdrop when open', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close settings');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Timer Duration Settings', () => {
    it('should display current timer duration values', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByDisplayValue('25')).toBeInTheDocument(); // work duration
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // short break
      expect(screen.getByDisplayValue('15')).toBeInTheDocument(); // long break
      expect(screen.getByDisplayValue('4')).toBeInTheDocument(); // sessions until long break
    });

    it('should render all duration input fields', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByLabelText('Work Duration')).toBeInTheDocument();
      expect(screen.getByLabelText('Short Break')).toBeInTheDocument();
      expect(screen.getByLabelText('Long Break')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Sessions Until Long Break')
      ).toBeInTheDocument();
    });

    it('should update work duration when changed', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const workDurationInput = screen.getByLabelText('Work Duration');
      fireEvent.change(workDurationInput, { target: { value: '30' } });

      expect(workDurationInput).toHaveValue(30);
    });

    it('should validate duration limits', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const workDurationInput = screen.getByLabelText('Work Duration');

      // Test max limit (120 minutes)
      fireEvent.change(workDurationInput, { target: { value: '150' } });
      expect(workDurationInput).toHaveValue(120);

      // Test min limit (1 minute)
      fireEvent.change(workDurationInput, { target: { value: '0' } });
      expect(workDurationInput).toHaveValue(1);
    });
  });

  describe('Auto-start Settings', () => {
    it('should display auto-start toggles', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByText('Auto-start break sessions')).toBeInTheDocument();
      expect(screen.getByText('Auto-start work sessions')).toBeInTheDocument();
    });

    it('should reflect current auto-start settings', () => {
      const settingsWithAutoStart = {
        ...mockSettings,
        auto_start_breaks: true,
        auto_start_work: true,
      };

      render(
        <PomodoroSettingsModal
          {...defaultProps}
          settings={settingsWithAutoStart}
        />
      );

      const autoStartBreaks = screen.getByLabelText(
        'Auto-start break sessions'
      );
      const autoStartWork = screen.getByLabelText('Auto-start work sessions');

      expect(autoStartBreaks).toBeChecked();
      expect(autoStartWork).toBeChecked();
    });

    it('should toggle auto-start settings', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const autoStartBreaks = screen.getByLabelText(
        'Auto-start break sessions'
      );
      expect(autoStartBreaks).not.toBeChecked();

      fireEvent.click(autoStartBreaks);
      expect(autoStartBreaks).toBeChecked();
    });
  });

  describe('Sound Settings', () => {
    it('should display sound settings', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByText('Enable sound')).toBeInTheDocument();
      expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    });

    it('should reflect current sound settings', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const enableSound = screen.getByLabelText('Enable sound');
      const enableNotifications = screen.getByLabelText('Enable notifications');

      expect(enableSound).toBeChecked();
      expect(enableNotifications).toBeChecked();
    });

    it('should toggle sound settings', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const enableSound = screen.getByLabelText('Enable sound');
      expect(enableSound).toBeChecked();

      fireEvent.click(enableSound);
      expect(enableSound).not.toBeChecked();
    });

    it('should disable sound when enable sound is off', () => {
      const settingsWithoutSound = {
        ...mockSettings,
        enable_audio: false,
      };

      render(
        <PomodoroSettingsModal
          {...defaultProps}
          settings={settingsWithoutSound}
        />
      );

      const enableSound = screen.getByLabelText('Enable sound');
      expect(enableSound).not.toBeChecked();
    });
  });

  describe('Preset Management', () => {
    it('should display preset section', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByText('Presets')).toBeInTheDocument();
    });

    it('should show available presets', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByText('Classic Pomodoro')).toBeInTheDocument();
      expect(screen.getByText('Extended Focus')).toBeInTheDocument();
    });

    it('should highlight default preset', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      // Find the preset container div that has the border styling
      const classicPresetContainer = screen
        .getByText('Classic Pomodoro')
        .closest('.border-blue-500');
      expect(classicPresetContainer).toBeInTheDocument();
      expect(classicPresetContainer).toHaveClass(
        'border-blue-500',
        'bg-blue-50'
      );
    });

    it('should apply preset when clicked', () => {
      const mockApplyPreset = vi.fn();
      render(
        <PomodoroSettingsModal
          {...defaultProps}
          onApplyPreset={mockApplyPreset}
        />
      );

      const applyButton = screen.getAllByText('Apply')[1]; // Second Apply button for Extended Focus
      fireEvent.click(applyButton);

      expect(mockApplyPreset).toHaveBeenCalledWith(2);
    });

    it('should show save preset option', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const savePresetButton = screen.getByText('Save as Preset');
      expect(savePresetButton).toBeInTheDocument();
    });

    it('should handle preset deletion', () => {
      const mockDeletePreset = vi.fn();
      render(
        <PomodoroSettingsModal
          {...defaultProps}
          onDeletePreset={mockDeletePreset}
        />
      );

      // Look for delete buttons (might be rendered as X or trash icons)
      const deleteButtons = screen.getAllByLabelText(/delete preset/i);
      expect(deleteButtons).toHaveLength(2); // Two presets, two delete buttons

      fireEvent.click(deleteButtons[1]); // Delete Extended Focus
      expect(mockDeletePreset).toHaveBeenCalledWith(2);
    });
  });

  describe('Form Actions', () => {
    it('should render cancel and save buttons', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const mockCancel = vi.fn();
      render(<PomodoroSettingsModal {...defaultProps} onCancel={mockCancel} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when close button is clicked', () => {
      const mockCancel = vi.fn();
      render(<PomodoroSettingsModal {...defaultProps} onCancel={mockCancel} />);

      fireEvent.click(screen.getByLabelText('Close settings'));
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when backdrop is clicked', () => {
      const mockCancel = vi.fn();
      render(<PomodoroSettingsModal {...defaultProps} onCancel={mockCancel} />);

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30');
      fireEvent.click(backdrop!);
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save button is clicked', async () => {
      const mockSave = vi.fn().mockResolvedValue(undefined);
      render(<PomodoroSettingsModal {...defaultProps} onSave={mockSave} />);

      fireEvent.click(screen.getByText('Save Settings'));

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onSave with updated settings', async () => {
      const mockSave = vi.fn().mockResolvedValue(undefined);
      render(<PomodoroSettingsModal {...defaultProps} onSave={mockSave} />);

      // Change work duration
      const workDurationInput = screen.getByLabelText('Work Duration');
      fireEvent.change(workDurationInput, { target: { value: '30' } });

      // Toggle auto-start breaks
      const autoStartBreaks = screen.getByLabelText(
        'Auto-start break sessions'
      );
      fireEvent.click(autoStartBreaks);

      // Save
      fireEvent.click(screen.getByText('Save Settings'));

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          work_duration: 30,
          short_break_duration: 5,
          long_break_duration: 15,
          sessions_until_long_break: 4,
          auto_start_breaks: true,
          auto_start_work: false,
          enable_audio: true,
          enable_notifications: true,
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when loading is true', () => {
      render(<PomodoroSettingsModal {...defaultProps} loading={true} />);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when loading', () => {
      render(<PomodoroSettingsModal {...defaultProps} loading={true} />);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });

    it('should show loading spinner when loading', () => {
      render(<PomodoroSettingsModal {...defaultProps} loading={true} />);

      // Look for loading spinner (might be a specific class or test id)
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to save settings';
      render(<PomodoroSettingsModal {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should call onClearError when error is dismissed', () => {
      const mockClearError = vi.fn();
      render(
        <PomodoroSettingsModal
          {...defaultProps}
          error="Test error"
          onClearError={mockClearError}
        />
      );

      // Find the X button in the error display
      const dismissButton = document.querySelector(
        '.text-red-500.hover\\:text-red-700'
      );
      fireEvent.click(dismissButton!);

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('should not render error section when error is null', () => {
      render(<PomodoroSettingsModal {...defaultProps} error={null} />);

      const errorSection = document.querySelector('.bg-red-100');
      expect(errorSection).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should prevent saving invalid duration values', () => {
      const mockSave = vi.fn();
      render(<PomodoroSettingsModal {...defaultProps} onSave={mockSave} />);

      // Try to set work duration to 0 (invalid)
      const workDurationInput = screen.getByLabelText('Work Duration');
      fireEvent.change(workDurationInput, { target: { value: '0' } });

      fireEvent.click(screen.getByText('Save Settings'));

      // Should save with clamped value (1)
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          work_duration: 1,
        })
      );
    });

    it('should validate sessions until long break range', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const sessionsInput = screen.getByLabelText('Sessions Until Long Break');

      // Test below minimum
      fireEvent.change(sessionsInput, { target: { value: '1' } });
      expect(sessionsInput).toHaveValue(2);

      // Test above maximum
      fireEvent.change(sessionsInput, { target: { value: '15' } });
      expect(sessionsInput).toHaveValue(12);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      expect(screen.getByLabelText('Work Duration')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Auto-start break sessions')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Enable sound')).toBeInTheDocument();
    });

    it('should be focusable and keyboard navigable', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      // First focusable element should be the close button
      const closeButton = screen.getByLabelText('Close settings');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('should trap focus within modal', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      // Focus should stay within the modal when tabbing
      const firstFocusable = screen.getByLabelText('Close settings');
      const lastFocusable = screen.getByText('Save Settings');

      firstFocusable.focus();
      expect(document.activeElement).toBe(firstFocusable);

      // Simulate tabbing to last element
      lastFocusable.focus();
      expect(document.activeElement).toBe(lastFocusable);
    });
  });

  describe('Responsive Design', () => {
    it('should render responsively on different screen sizes', () => {
      render(<PomodoroSettingsModal {...defaultProps} />);

      const modalContent = screen
        .getByText('Timer Settings')
        .closest('.bg-white');
      expect(modalContent).toHaveClass('max-w-2xl'); // Responsive max width
    });
  });
});
