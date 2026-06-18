import { useGameStore } from '@/store/gameStore';

export const TutorialPage = () => {
  const { navigateTo } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigateTo('menu')}
          className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 transition-colors"
        >
          ← 返回主菜单
        </button>

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          📖 游戏教程
        </h1>

        <div className="space-y-8">
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> 游戏目标
            </h2>
            <p className="text-slate-300">
              在有限的时间内，合理安排各工位的清理和补料任务，确保在下一场体验开始前让关键工位恢复到最佳状态。
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🎮</span> 基本操作
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🧹</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">清理任务</h3>
                  <p className="text-slate-400">自动为清洁度低于80%的工位生成清理任务</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">📦</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">补料任务</h3>
                  <p className="text-slate-400">点击工位上的"触发补料"按钮添加补料任务</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">🔀</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">拖拽排序</h3>
                  <p className="text-slate-400">拖拽待执行任务调整执行顺序，排在前面的任务优先执行</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl">⭐</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">优先级调整</h3>
                  <p className="text-slate-400">通过下拉菜单调整任务优先级，高优先级任务会优先执行</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>⚠️</span> 特殊事件
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">🚨 材料缺失</h3>
                <p className="text-slate-300 text-sm">某工位材料包缺失，需要优先补料</p>
              </div>
              <div className="bg-orange-600/20 border border-orange-500/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">💩 重度污损</h3>
                <p className="text-slate-300 text-sm">某工位污损严重，清洁时间加倍</p>
              </div>
              <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-400 mb-2">⏰ 讲解员延迟</h3>
                <p className="text-slate-300 text-sm">获得额外10秒准备时间</p>
              </div>
              <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">🚨 观众提前</h3>
                <p className="text-slate-300 text-sm">下一场提前到达，时间减少15秒</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span> 评分标准
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                <span className="text-slate-300">🧹 清理完成率</span>
                <span className="text-cyan-400 font-bold">30%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                <span className="text-slate-300">📦 补料准确率</span>
                <span className="text-blue-400 font-bold">25%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                <span className="text-slate-300">⏱️ 延误时长</span>
                <span className="text-yellow-400 font-bold">25%</span>
              </div>
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-3">
                <span className="text-slate-300">🏭 工位利用率</span>
                <span className="text-orange-400 font-bold">20%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>💡</span> 游戏技巧
            </h2>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                优先处理标记为"关键工位"的任务
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                合理使用拖拽调整任务执行顺序
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                高优先级任务会自动排在前面执行
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                最多同时执行2个任务
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                提前完成可以点击"开始下一场"减少延误扣分
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigateTo('levelSelect')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xl py-4 px-12 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              🎮 开始游戏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
