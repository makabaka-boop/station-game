import { useGameStore } from '@/store/gameStore';
import { LEVELS } from '@/data/levels';

export const TimerBar = () => {
  const { timeRemaining, currentLevelId, earlyArrivalTime, guideDelayTime } = useGameStore();
  const level = LEVELS.find((l) => l.id === currentLevelId);

  if (!level) return null;

  const actualTimeRemaining = Math.max(0, timeRemaining - earlyArrivalTime + guideDelayTime);
  const totalDuration = level.duration;
  const progress = (actualTimeRemaining / totalDuration) * 100;

  const isUrgent = actualTimeRemaining <= 10;
  const isWarning = actualTimeRemaining <= 20 && !isUrgent;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-300 font-medium">剩余时间</span>
        <div className="flex items-center gap-2">
          {earlyArrivalTime > 0 && (
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
              提前 - {earlyArrivalTime}s
            </span>
          )}
          {guideDelayTime > 0 && (
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
              延迟 + {guideDelayTime}s
            </span>
          )}
          <span
            className={`font-mono text-2xl font-bold ${
              isUrgent
                ? 'text-red-500 animate-pulse'
                : isWarning
                ? 'text-yellow-500'
                : 'text-white'
            }`}
          >
            {formatTime(actualTimeRemaining)}
          </span>
        </div>
      </div>
      <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isUrgent
              ? 'bg-gradient-to-r from-red-600 to-red-400'
              : isWarning
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
              : 'bg-gradient-to-r from-blue-600 to-cyan-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
