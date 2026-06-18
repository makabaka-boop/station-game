import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export const EventNotification = () => {
  const { activeEvents, dismissedEventIndices, dismissEvent } = useGameStore();
  const [localDismissed, setLocalDismissed] = useState<Set<number>>(new Set());

  const triggeredEvents = activeEvents
    .map((e, i) => ({ ...e, originalIndex: i }))
    .filter((e) => e.triggered && !dismissedEventIndices.includes(e.originalIndex) && !localDismissed.has(e.originalIndex));

  const handleDismiss = (index: number) => {
    setLocalDismissed((prev) => new Set(prev).add(index));
    dismissEvent(index);
  };

  if (triggeredEvents.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {triggeredEvents.map((event) => (
        <AutoDismissNotification
          key={event.originalIndex}
          event={event}
          onDismiss={() => handleDismiss(event.originalIndex)}
        />
      ))}
    </div>
  );
};

interface AutoDismissNotificationProps {
  event: { type: string; description: string; originalIndex: number };
  onDismiss: () => void;
}

const AutoDismissNotification = ({ event, onDismiss }: AutoDismissNotificationProps) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const enterTimer = setTimeout(() => {
      setLeaving(true);
    }, 3000);

    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className={`p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-500 ${
        visible && !leaving
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full'
      } ${
        event.type === 'missing_material'
          ? 'bg-red-600'
          : event.type === 'severe_dirt'
          ? 'bg-orange-600'
          : event.type === 'guide_delay'
          ? 'bg-green-600'
          : 'bg-yellow-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-white font-medium">{event.description}</p>
        <span className="text-white/60 text-sm ml-2 whitespace-nowrap">点击关闭</span>
      </div>
    </div>
  );
};
