export type Priority = 'P1' | 'P2' | 'P3' | 'P4' | '';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  color: string;
  user?: User;
  parent?: number;
  position: number;
  is_active: boolean;
  task_count?: number;
  completed_task_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskComment {
  id: number;
  user: User;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  notes?: string;
  priority: Priority;
  date?: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  user?: User;
  project?: Project;
  project_id?: number;
  parent_task?: number;
  labels: Label[];
  label_ids?: number[];
  position: number;
  comments?: TaskComment[];
  is_overdue: boolean;
  subtask_count: number;
  completed_subtask_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskListItem {
  id: number;
  title: string;
  priority: Priority;
  date?: string;
  due_date?: string;
  is_completed: boolean;
  project?: {
    id: number;
    name: string;
    color: string;
  };
  parent_task?: number;
  labels: Label[];
  position: number;
  is_overdue: boolean;
  subtask_count: number;
  completed_subtask_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskQuickCreate {
  title: string;
  priority?: Priority;
  date?: string;
  due_date?: string;
  project_id?: number;
  parent_task?: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  this_week: number;
  priority_breakdown: {
    P1: number;
    P2: number;
    P3: number;
    P4: number;
    none: number;
  };
}

export interface TaskFilters {
  view?: 'today' | 'week' | 'overdue';
  priority?: Priority;
  project?: number;
  completed?: boolean;
  parent_task?: number;
  search?: string;
  subtasks?: 'include';
}

export interface TaskBulkUpdate {
  task_ids: number[];
  action: 'complete' | 'uncomplete' | 'reorder';
  positions?: Record<string, number>;
}
