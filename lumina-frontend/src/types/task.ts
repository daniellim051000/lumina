export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  project?: string;
  tags?: string[];
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}
