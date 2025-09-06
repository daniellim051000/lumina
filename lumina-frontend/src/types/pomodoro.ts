/**
 * TypeScript types for Pomodoro timer functionality
 */

export interface PomodoroSettings {
  id: number;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  auto_start_breaks: boolean;
  auto_start_work: boolean;
  enable_audio: boolean;
  work_sound: string;
  break_sound: string;
  volume: number;
  enable_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface PomodoroPreset {
  id: number;
  name: string;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type PomodoroSessionType = 'work' | 'short_break' | 'long_break';

export type PomodoroSessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'skipped'
  | 'cancelled';

export interface PomodoroSession {
  id: number;
  task?: number;
  task_title?: string;
  session_type: PomodoroSessionType;
  status: PomodoroSessionStatus;
  planned_duration: number;
  actual_duration?: number;
  started_at: string;
  paused_at?: string;
  completed_at?: string;
  session_number: number;
  notes?: string;
  productivity_rating?: number; // 1-5 scale for work sessions
  elapsed_minutes: number;
  remaining_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface PomodoroSessionCreate {
  task?: number;
  session_type: PomodoroSessionType;
  planned_duration: number;
  session_number: number;
  notes?: string;
}

export interface PomodoroSessionUpdate {
  status?: PomodoroSessionStatus;
  notes?: string;
  productivity_rating?: number;
}

export interface PomodoroSessionStats {
  total_sessions: number;
  completed_sessions: number;
  work_sessions: number;
  break_sessions: number;
  total_focus_time: number; // in minutes
  average_session_duration: number;
  completion_rate: number; // percentage
  daily_average: number;
  current_streak: number;
  longest_streak: number;
  sessions_by_day: Record<string, number>; // date -> count
  focus_time_by_day: Record<string, number>; // date -> minutes
  average_productivity?: number;
  productivity_distribution: Record<string, number>; // rating -> count
}

// Timer state for frontend management
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentSession: PomodoroSession | null;
  timeRemaining: number; // in seconds
  sessionType: PomodoroSessionType;
  sessionNumber: number;
  totalSessions: number;
}

// Timer configuration for creating sessions
export interface TimerConfig {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

// Audio configuration
export interface AudioConfig {
  enabled: boolean;
  workSound: string;
  breakSound: string;
  volume: number;
}

// Notification configuration
export interface NotificationConfig {
  enabled: boolean;
  showSystemNotifications: boolean;
}

// Available sound options
export interface SoundOption {
  id: string;
  name: string;
  file: string;
}

// Timer control actions
export type TimerAction =
  | 'start'
  | 'pause'
  | 'resume'
  | 'skip'
  | 'stop'
  | 'complete';

// Session filters for API queries
export interface SessionFilters {
  type?: PomodoroSessionType;
  status?: PomodoroSessionStatus;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string;
}

// Preset creation/update data
export interface PomodoroPresetData {
  name: string;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  is_default?: boolean;
}

// Settings update data
export interface PomodoroSettingsUpdate {
  work_duration?: number;
  short_break_duration?: number;
  long_break_duration?: number;
  sessions_until_long_break?: number;
  auto_start_breaks?: boolean;
  auto_start_work?: boolean;
  enable_audio?: boolean;
  work_sound?: string;
  break_sound?: string;
  volume?: number;
  enable_notifications?: boolean;
}
