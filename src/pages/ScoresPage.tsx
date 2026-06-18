import { useGameStore } from '@/store/gameStore';
import { getScoreHistory, resetSaveData, getReplayByTimestamp } from '@/utils/storage';
import { LEVELS } from '@/data/levels';
import { useState } from 'react';

export const ScoresPage = () => {
  const { navigateTo, getBestScores, getUnlockedLevels, viewReplay } = useGameStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const scoreHistory = getScoreHistory();
  const bestScores = getBestScores();
  const unlockedLevels = getUnlockedLevels();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (stars: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={i < stars ? 'text-yellow-400' : 'text-slate-600'}>
        ★
      </span>
    ));
  };

  const handleReset = () => {
    resetSaveData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigateTo('menu')}
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            ← 返回主菜单
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            重置数据
          </button>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🏆 成绩记录
        </h1>

        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">关卡进度</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((level) => {
              const isUnlocked = unlockedLevels.includes(level.id);
              const bestScore = bestScores[level.id];

              return (
                <div
                  key={level.id}
                  className={`p-4 rounded-lg ${
                    isUnlocked ? 'bg-slate-700' : 'bg-slate-900/50 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-medium">{level.name}</span>
                    {!isUnlocked && <span>🔒</span>}
                  </div>
                  {bestScore ? (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(bestScore.stars)}
                      </div>
                      <div className="text-cyan-400 font-bold">
                        {bestScore.totalScore} 分
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm">
                      {isUnlocked ? '未游玩' : '未解锁'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">历史记录</h2>
          {scoreHistory.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scoreHistory.map((score, index) => {
                const level = LEVELS.find((l) => l.id === score.levelId);
                const hasReplay = getReplayByTimestamp(score.timestamp) !== null;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between bg-slate-700/50 rounded-lg p-4 transition-colors ${
                      hasReplay ? 'hover:bg-slate-700 cursor-pointer' : ''
                    }`}
                    onClick={() => hasReplay && viewReplay(score.timestamp)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 w-8 text-center">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="text-white font-medium">
                          {level?.name || `关卡 ${score.levelId}`}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {formatDate(score.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {renderStars(score.stars)}
                      </div>
                      <span className="text-cyan-400 font-bold text-lg">
                        {score.totalScore}
                      </span>
                      {hasReplay && (
                        <span className="text-purple-400 text-sm">📊</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              暂无游戏记录，快去挑战吧！
            </div>
          )}
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-sm mx-4">
              <h3 className="text-xl font-bold text-white mb-4">确认重置</h3>
              <p className="text-slate-300 mb-6">
                确定要重置所有游戏数据吗？此操作不可撤销，所有关卡进度和成绩将被清除。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
