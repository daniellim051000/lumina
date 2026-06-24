import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface CalendarHeaderProps {
  year: number;
  month: number; // 0-indexed
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  year,
  month,
  onPrev,
  onNext,
  onToday,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">
        {t(`calendar.months.${month}`)} {year}
      </h1>
      <div className="flex items-center space-x-2">
        <button
          onClick={onToday}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('calendar.today')}
        </button>
        <button
          onClick={onPrev}
          aria-label={t('calendar.prevMonth')}
          className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onNext}
          aria-label={t('calendar.nextMonth')}
          className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
