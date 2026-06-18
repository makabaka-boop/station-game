import { useGameStore } from '@/store/gameStore';

export const MainMenu = () => {
  const { navigateTo } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏭 工位调度大师
          </h1>
          <p className="text-slate-400 text-lg">
            在有限时间内合理安排工位清理与补料
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigateTo('levelSelect')}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xl py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            🎮 开始游戏
          </button>

          <button
            onClick={() => navigateTo('tutorial')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium text-lg py-3 px-6 rounded-xl transition-all"
          >
            📖 游戏教程
          </button>

          <button
            onClick={() => navigateTo('scores')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium text-lg py-3 px-6 rounded-xl transition-all"
          >
            🏆 成绩记录
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            拖拽任务 · 调整优先级 · 触发补料
          </p>
        </div>
      </div>
    </div>
  );
};
