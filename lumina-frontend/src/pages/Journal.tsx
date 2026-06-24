import React from 'react';
import { JournalListView } from '../components/journal/JournalListView';

export const JournalPage: React.FC = () => {
  return (
    <div className="h-full">
      <JournalListView />
    </div>
  );
};
