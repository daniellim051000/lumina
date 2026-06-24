import { User } from './task';

export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'awful' | '';

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: Mood;
  date: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryListItem {
  id: number;
  title: string;
  mood: Mood;
  date: string;
  content_preview: string;
  created_at: string;
  updated_at: string;
}

export interface JournalFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  mood?: Mood;
  search?: string;
}
