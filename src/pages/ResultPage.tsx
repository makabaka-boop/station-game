import { useGameStore } from '@/store/gameStore';
import { LEVELS } from '@/data/levels';

export const ResultPage = () => {
  const { currentScore, currentLevelId, navigateTo, startLevel, getUnlockedLevels, viewReplay } = useGameStore();
  const level = LEVELS.find((l) => l.id === currentLevelId);
  const unlockedLevels = getUnlockedLevels();

  if (!currentScore || !level) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">没有成绩数据</p>
          <button
            onClick={() => navigateTo('levelSelect')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            返回选择关卡
          </button>
        </div>
      </div>
    );
  }

  const isUnlocked = unlockedLevels.includes(level.id + 1);
  const canUnlockNext = currentScore.totalScore >= level.unlockScore && level.id < LEVELS.length;

  const renderStars = (stars: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        className={`text-5xl ${i < stars ? 'text-yellow-400 animate-bounce' : 'text-slate-600'}`}
        style={{ animationDelay: `${i * 0.1}s` }}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">游戏结束!</h1>
            <p className="text-slate-400">{level.name}</p>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center gap-2 mb-4">
              {renderStars(currentScore.stars)}
            </div>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {currentScore.totalScore}
            </div>
            <p className="text-slate-400 mt-2">总分</p>
          </div>

          {canUnlockNext && (
            <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 mb-6 text-center">
              <p className="text-green-400 font-medium">
                🎉 恭喜！已解锁下一关！
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">🧹 清理完成率</span>
                <span className="text-white font-bold">{currentScore.cleanRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${currentScore.cleanRate}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">📦 补料准确率</span>
                <span className="text-white font-bold">{currentScore.refillAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${currentScore.refillAccuracy}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">⏱️ 延误时长</span>
                <span className={`font-bold ${
                  currentScore.delayDuration <= 5 ? 'text-green-400' :
                  currentScore.delayDuration <= 15 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {currentScore.delayDuration}秒
                </span>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">🏭 工位利用率</span>
                <span className="text-white font-bold">{currentScore.stationUtilization}%</span>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${currentScore.stationUtilization}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startLevel(level.id)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              🔄 重新挑战
            </button>

            {currentScore && (
              <button
                onClick={() => viewReplay(currentScore.timestamp)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                📊 查看复盘
              </button>
            )}

            {isUnlocked && level.id < LEVELS.length && (
              <button
                onClick={() => startLevel(level.id + 1)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                ➡️ 下一关
              </button>
            )}

            <button
              onClick={() => navigateTo('levelSelect')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-6 rounded-lg transition-all"
            >
              📋 选择关卡
            </button>

            <button
              onClick={() => navigateTo('menu')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded-lg transition-all"
            >
              🏠 返回主菜单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
