import { useGameStore } from '@/store/gameStore';
import { getReplayByTimestamp, getBestScores } from '@/utils/storage';
import { LEVELS, STATION_NAMES } from '@/data/levels';
import { ReplayData, ReplayTaskRecord } from '@/types';

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  missing_material: { label: '材料缺失', color: 'text-red-400', icon: '📦' },
  severe_dirt: { label: '严重污损', color: 'text-orange-400', icon: '💩' },
  guide_delay: { label: '讲解延迟', color: 'text-green-400', icon: '⏰' },
  early_arrival: { label: '提前到达', color: 'text-yellow-400', icon: '🚨' },
};

const MATERIAL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  full: { label: '充足', color: 'text-green-400' },
  partial: { label: '部分', color: 'text-yellow-400' },
  empty: { label: '空', color: 'text-red-400' },
  missing: { label: '缺失', color: 'text-red-500' },
};

export const ReplayPage = () => {
  const { currentReplayTimestamp, replayReturnPage, navigateTo } = useGameStore();

  const replay = currentReplayTimestamp ? getReplayByTimestamp(currentReplayTimestamp) : null;
  const bestScores = getBestScores();
  const level = replay ? LEVELS.find((l) => l.id === replay.levelId) : null;

  const handleBack = () => {
    if (replayReturnPage) {
      navigateTo(replayReturnPage);
    } else {
      navigateTo('scores');
    }
  };

  if (!replay || !level) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">复盘数据未找到</p>
          <button
            onClick={() => navigateTo('scores')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            返回成绩记录
          </button>
        </div>
      </div>
    );
  }

  const bestScore = bestScores[replay.levelId];
  const isBestScore = bestScore && bestScore.timestamp === replay.scoreTimestamp;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            ← {replayReturnPage === 'result' ? '返回结算页' : '返回成绩记录'}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 关卡复盘</h1>
          <p className="text-slate-400">{level.name}</p>
        </div>

        <ScoreOverview replay={replay} isBestScore={isBestScore} bestScore={bestScore} />

        <EventTimeline replay={replay} />

        <TaskCompletionOrder replay={replay} />

        <FinalStationStates replay={replay} />

        <ScoreBreakdown replay={replay} bestScore={bestScore} />

        <div className="mt-8 flex justify-center gap-4">
          {replayReturnPage === 'result' && (
            <button
              onClick={() => navigateTo('result')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-all"
            >
              🏁 返回结算页
            </button>
          )}
          <button
            onClick={() => navigateTo('scores')}
            className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-8 rounded-lg transition-all"
          >
            📋 成绩记录
          </button>
        </div>
      </div>
    </div>
  );
};

const ScoreOverview = ({
  replay,
  isBestScore,
  bestScore,
}: {
  replay: ReplayData;
  isBestScore: boolean;
  bestScore: { totalScore: number } | undefined;
}) => (
  <div className="bg-slate-800 rounded-xl p-6 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          {replay.scoreBreakdown.totalScore}
        </div>
        <p className="text-slate-400 mt-1">本局总分</p>
      </div>
      <div className="text-right">
        {isBestScore ? (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
            <span className="text-yellow-400 font-bold">🏆 历史最佳</span>
          </div>
        ) : bestScore ? (
          <div>
            <div className="text-slate-400 text-sm">历史最佳</div>
            <div className="text-2xl font-bold text-yellow-400">{bestScore.totalScore}</div>
            <div className="text-red-400 text-sm mt-1">
              差距 {bestScore.totalScore - replay.scoreBreakdown.totalScore} 分
            </div>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

const EventTimeline = ({ replay }: { replay: ReplayData }) => (
  <div className="bg-slate-800 rounded-xl p-6 mb-6">
    <h2 className="text-xl font-bold text-white mb-4">⚡ 事件触发时间线</h2>
    {replay.events.length > 0 ? (
      <div className="space-y-3">
        {replay.events
          .sort((a, b) => a.triggeredAtElapsed - b.triggeredAtElapsed)
          .map((event, index) => {
            const eventInfo = EVENT_TYPE_LABELS[event.type] || {
              label: event.type,
              color: 'text-white',
              icon: '❓',
            };
            return (
              <div key={index} className="flex items-start gap-4 bg-slate-700/50 rounded-lg p-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl">{eventInfo.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${eventInfo.color}`}>{eventInfo.label}</span>
                    {event.stationId && (
                      <span className="text-slate-400 text-sm">
                        ({STATION_NAMES[event.stationId - 1] || `工位${event.stationId}`})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm">{event.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-cyan-400 font-mono font-bold">
                    {formatElapsed(event.triggeredAtElapsed)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    ) : (
      <div className="text-center py-6 text-slate-500">本局无事件触发</div>
    )}
  </div>
);

const TaskCompletionOrder = ({ replay }: { replay: ReplayData }) => {
  const completedTasks = replay.tasks
    .filter((t) => t.completedAtElapsed !== null)
    .sort((a, b) => (a.completedAtElapsed ?? 0) - (b.completedAtElapsed ?? 0));

  const incompleteTasks = replay.tasks.filter(
    (t) => t.completedAtElapsed === null && !t.removed
  );

  const removedTasks = replay.tasks.filter((t) => t.removed);

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">📋 任务完成顺序</h2>
      {completedTasks.length > 0 ? (
        <div className="space-y-2 mb-4">
          {completedTasks.map((task, index) => (
            <TaskRow key={task.id} task={task} index={index + 1} />
          ))}
        </div>
      ) : null}
      {incompleteTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-slate-400 text-sm mb-2">未完成任务</h3>
          <div className="space-y-2">
            {incompleteTasks.map((task) => (
              <TaskRow key={task.id} task={task} index={null} incomplete />
            ))}
          </div>
        </div>
      )}
      {removedTasks.length > 0 && (
        <div>
          <h3 className="text-orange-400 text-sm mb-2">🗑️ 已删除任务</h3>
          <div className="space-y-2">
            {removedTasks.map((task) => (
              <TaskRow key={task.id} task={task} index={null} removed />
            ))}
          </div>
        </div>
      )}
      {completedTasks.length === 0 && incompleteTasks.length === 0 && removedTasks.length === 0 && (
        <div className="text-center py-6 text-slate-500">本局无任务记录</div>
      )}
    </div>
  );
};

const TaskRow = ({
  task,
  index,
  incomplete,
  removed,
}: {
  task: ReplayTaskRecord;
  index: number | null;
  incomplete?: boolean;
  removed?: boolean;
}) => {
  const stationName = STATION_NAMES[task.stationId - 1] || `工位${task.stationId}`;
  const typeLabel = task.type === 'clean' ? '🧹 清理' : '📦 补料';

  return (
    <div
      className={`flex items-center gap-4 rounded-lg p-3 ${
        removed
          ? 'bg-orange-900/20 border border-orange-800/30'
          : incomplete
          ? 'bg-red-900/20 border border-red-800/30'
          : 'bg-slate-700/50'
      }`}
    >
      {index !== null && (
        <span className="text-slate-500 w-8 text-center font-mono">#{index}</span>
      )}
      {incomplete && (
        <span className="text-red-400 w-8 text-center">✗</span>
      )}
      {removed && (
        <span className="text-orange-400 w-8 text-center">🗑️</span>
      )}
      <span className={`font-medium ${removed ? 'text-orange-300 line-through' : 'text-white'}`}>
        {typeLabel}
      </span>
      <span className={` ${removed ? 'text-orange-400/60' : 'text-slate-400'}`}>
        {stationName}
      </span>
      <span className={`text-sm ${removed ? 'text-orange-400/50' : 'text-slate-500'}`}>
        优先级: {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
      </span>
      <div className="flex-1" />
      {task.startedAtElapsed !== null && (
        <span className={`text-sm ${removed ? 'text-orange-400/60' : 'text-slate-400'}`}>
          开始 {formatElapsed(task.startedAtElapsed)}
        </span>
      )}
      {task.completedAtElapsed !== null && (
        <span className="text-green-400 text-sm">
          完成 {formatElapsed(task.completedAtElapsed)}
        </span>
      )}
      {removed && task.removedAtElapsed !== null && (
        <span className="text-orange-400 text-sm">
          删除 {formatElapsed(task.removedAtElapsed)}
        </span>
      )}
      {incomplete && task.startedAtElapsed !== null && (
        <span className="text-red-400 text-sm">未完成</span>
      )}
      {incomplete && task.startedAtElapsed === null && (
        <span className="text-red-400 text-sm">未开始</span>
      )}
    </div>
  );
};

const FinalStationStates = ({ replay }: { replay: ReplayData }) => (
  <div className="bg-slate-800 rounded-xl p-6 mb-6">
    <h2 className="text-xl font-bold text-white mb-4">🏭 工位最终状态</h2>
    <div className="grid gap-3 md:grid-cols-2">
      {replay.finalStations.map((station) => {
        const materialInfo = MATERIAL_STATUS_LABELS[station.materialStatus] || {
          label: station.materialStatus,
          color: 'text-white',
        };
        return (
          <div key={station.id} className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{station.name}</span>
                {station.isCritical && (
                  <span className="text-xs bg-red-600/30 text-red-400 px-2 py-0.5 rounded">
                    关键
                  </span>
                )}
              </div>
              {station.isDirty && (
                <span className="text-xs bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded">
                  污损
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">清洁度</span>
                  <span
                    className={
                      station.cleanliness >= 80
                        ? 'text-green-400'
                        : station.cleanliness >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }
                  >
                    {station.cleanliness}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      station.cleanliness >= 80
                        ? 'bg-green-500'
                        : station.cleanliness >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${station.cleanliness}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">物料状态</span>
                <span className={materialInfo.color}>{materialInfo.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const ScoreBreakdown = ({
  replay,
  bestScore,
}: {
  replay: ReplayData;
  bestScore: { cleanRate: number; refillAccuracy: number; delayDuration: number; stationUtilization: number; totalScore: number } | undefined;
}) => {
  const items = [
    {
      label: '🧹 清理完成率',
      value: replay.scoreBreakdown.cleanRate,
      bestValue: bestScore?.cleanRate,
      weight: '30%',
      barColor: 'bg-cyan-500',
    },
    {
      label: '📦 补料准确率',
      value: replay.scoreBreakdown.refillAccuracy,
      bestValue: bestScore?.refillAccuracy,
      weight: '25%',
      barColor: 'bg-blue-500',
    },
    {
      label: '⏱️ 延误时长',
      value: replay.scoreBreakdown.delayDuration,
      bestValue: bestScore?.delayDuration,
      weight: '25%',
      barColor: 'bg-yellow-500',
      isDelay: true,
    },
    {
      label: '🏭 工位利用率',
      value: replay.scoreBreakdown.stationUtilization,
      bestValue: bestScore?.stationUtilization,
      weight: '20%',
      barColor: 'bg-orange-500',
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">📊 总分构成与最佳对比</h2>
      <div className="space-y-4">
        {items.map((item) => {
          const diff =
            item.bestValue !== undefined
              ? item.isDelay
                ? item.bestValue - item.value
                : item.value - item.bestValue
              : undefined;

          return (
            <div key={item.label} className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">
                  {item.label}
                  <span className="text-slate-500 text-xs ml-2">权重 {item.weight}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">
                    {item.isDelay ? `${item.value}秒` : `${item.value}%`}
                  </span>
                  {diff !== undefined && diff !== 0 && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        diff > 0
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}
                      {item.isDelay ? `${diff}秒` : `${diff}%`}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.barColor} rounded-full`}
                  style={{
                    width: `${item.isDelay ? Math.max(0, 100 - item.value * 2) : item.value}%`,
                  }}
                />
              </div>
              {item.bestValue !== undefined && (
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>最佳: {item.isDelay ? `${item.bestValue}秒` : `${item.bestValue}%`}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatElapsed = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
};
