import { useGameStore } from '@/store/gameStore';
import { LEVELS } from '@/data/levels';

export const LevelSelect = () => {
  const { navigateTo, startLevel, getUnlockedLevels, getBestScores } = useGameStore();
  const unlockedLevels = getUnlockedLevels();
  const bestScores = getBestScores();

  const renderStars = (stars: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={i < stars ? 'text-yellow-400' : 'text-slate-600'}>
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigateTo('menu')}
          className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 transition-colors"
        >
          ← 返回主菜单
        </button>

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎯 选择关卡
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {LEVELS.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const bestScore = bestScores[level.id];

            return (
              <div
                key={level.id}
                className={`relative p-6 rounded-xl transition-all ${
                  isUnlocked
                    ? 'bg-slate-800 hover:bg-slate-700 cursor-pointer transform hover:scale-102 border-2 border-slate-600 hover:border-blue-500'
                    : 'bg-slate-900/50 border-2 border-slate-700 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => isUnlocked && startLevel(level.id)}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">🔒</span>
                  </div>
                )}

                <div className={isUnlocked ? '' : 'blur-sm'}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        关卡 {level.id}: {level.name}
                      </h3>
                      <p className="text-slate-400 text-sm">{level.description}</p>
                    </div>
                    <div className="text-2xl">
                      {bestScore ? renderStars(bestScore.stars) : renderStars(0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-400">时间</div>
                      <div className="text-white font-bold">{level.duration}秒</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-400">工位</div>
                      <div className="text-white font-bold">{level.stationCount}个</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-400">解锁分</div>
                      <div className="text-white font-bold">{level.unlockScore}</div>
                    </div>
                  </div>

                  {level.events.length > 0 && (
                    <div className="mt-4">
                      <div className="text-slate-400 text-xs mb-2">特殊事件:</div>
                      <div className="flex flex-wrap gap-2">
                        {level.events.map((event, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              event.type === 'missing_material'
                                ? 'bg-red-600/30 text-red-400'
                                : event.type === 'severe_dirt'
                                ? 'bg-orange-600/30 text-orange-400'
                                : event.type === 'guide_delay'
                                ? 'bg-green-600/30 text-green-400'
                                : 'bg-yellow-600/30 text-yellow-400'
                            }`}
                          >
                            {event.type === 'missing_material' && '材料缺失'}
                            {event.type === 'severe_dirt' && '重度污损'}
                            {event.type === 'guide_delay' && '讲解员延迟'}
                            {event.type === 'early_arrival' && '观众提前'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {bestScore && (
                    <div className="mt-4 text-right">
                      <span className="text-slate-400 text-sm">最高分: </span>
                      <span className="text-cyan-400 font-bold">{bestScore.totalScore}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
