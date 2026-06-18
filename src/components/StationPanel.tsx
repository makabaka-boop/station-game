import { useGameStore } from '@/store/gameStore';
import { MaterialStatus } from '@/types';

const materialStatusConfig: Record<MaterialStatus, { label: string; color: string; icon: string }> = {
  full: { label: '充足', color: 'bg-green-500', icon: '✅' },
  partial: { label: '不足', color: 'bg-yellow-500', icon: '⚠️' },
  empty: { label: '空缺', color: 'bg-orange-500', icon: '❌' },
  missing: { label: '缺失', color: 'bg-red-600', icon: '🚨' },
};

interface StationCardProps {
  station: ReturnType<typeof useGameStore.getState>['stations'][0];
}

const StationCard = ({ station }: StationCardProps) => {
  const { triggerRefill, tasks } = useGameStore();
  const materialConfig = materialStatusConfig[station.materialStatus];
  const needsCleaning = station.cleanliness < 80;
  const needsRefill = station.materialStatus !== 'full';

  const hasRefillTask = tasks.some(
    (t) => t.type === 'refill' && t.stationId === station.id && t.status !== 'completed'
  );

  const hasRefillInProgress = tasks.some(
    (t) => t.type === 'refill' && t.stationId === station.id && t.status === 'in_progress'
  );

  const currentTask = tasks.find((t) => t.stationId === station.id && t.status === 'in_progress');

  const getCleanlinessColor = () => {
    if (station.cleanliness >= 80) return 'bg-green-500';
    if (station.cleanliness >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        station.isCritical
          ? 'border-orange-500 bg-slate-800'
          : station.isDirty
          ? 'border-red-500 bg-slate-800'
          : 'border-slate-600 bg-slate-800/50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{station.name}</span>
          {station.isCritical && (
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
              关键工位
            </span>
          )}
          {station.isDirty && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
              重度污损
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">清洁度</span>
            <span className={`font-medium ${station.cleanliness >= 80 ? 'text-green-400' : station.cleanliness >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {Math.round(station.cleanliness)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getCleanlinessColor()}`}
              style={{ width: `${station.cleanliness}%` }}
            />
          </div>
          {needsCleaning && currentTask?.type === 'clean' && (
            <div className="mt-1">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-cyan-400">清洁中...</span>
                <span className="text-cyan-400">{Math.round(currentTask.progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${currentTask.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${materialConfig.color}`} />
            <span className="text-slate-300 text-sm">
              {materialConfig.icon} 材料: {materialConfig.label}
            </span>
          </div>
          {needsRefill && (
            <button
              onClick={() => triggerRefill(station.id)}
              disabled={hasRefillTask}
              className={`text-xs px-3 py-1 rounded transition-all ${
                hasRefillTask
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
              }`}
            >
              {hasRefillInProgress ? '补料中...' : hasRefillTask ? '排队中' : '触发补料'}
            </button>
          )}
        </div>

        {needsRefill && currentTask?.type === 'refill' && (
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-blue-400">补料中...</span>
              <span className="text-blue-400">{Math.round(currentTask.progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${currentTask.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const StationPanel = () => {
  const { stations } = useGameStore();

  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>🏭</span> 工位状态
      </h3>
      <div className="grid gap-3">
        {stations.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
};
