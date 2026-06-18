import { useGameStore } from '@/store/gameStore';

export const ControlPanel = () => {
  const { gameStatus, pauseGame, resumeGame, startNextSession, navigateTo } = useGameStore();

  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>🎮</span> 控制面板
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {gameStatus === 'playing' && (
          <button
            onClick={pauseGame}
            className="flex-1 min-w-[120px] bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-2 px-4 rounded-lg transition-all active:scale-95"
          >
            ⏸️ 暂停
          </button>
        )}

        {gameStatus === 'paused' && (
          <button
            onClick={resumeGame}
            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-4 rounded-lg transition-all active:scale-95"
          >
            ▶️ 继续
          </button>
        )}

        <button
          onClick={startNextSession}
          className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all active:scale-95"
        >
          🚀 开始下一场
        </button>

        <button
          onClick={() => navigateTo('menu')}
          className="flex-1 min-w-[120px] bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-all active:scale-95"
        >
          🏠 返回菜单
        </button>
      </div>

      {gameStatus === 'paused' && (
        <div className="mt-4 text-center">
          <p className="text-yellow-400 text-lg font-medium animate-pulse">
            ⏸️ 游戏已暂停
          </p>
        </div>
      )}
    </div>
  );
};
