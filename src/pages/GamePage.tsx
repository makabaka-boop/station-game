import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TimerBar } from '@/components/TimerBar';
import { StationPanel } from '@/components/StationPanel';
import { TaskList } from '@/components/TaskList';
import { ControlPanel } from '@/components/ControlPanel';
import { EventNotification } from '@/components/EventNotification';
import { LEVELS } from '@/data/levels';

export const GamePage = () => {
  const { gameStatus, tick, currentLevelId, navigateTo } = useGameStore();
  const level = LEVELS.find((l) => l.id === currentLevelId);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, tick]);

  if (!level) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">关卡未找到</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <EventNotification />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  关卡 {level.id}: {level.name}
                </h1>
                <p className="text-slate-400 text-sm">{level.description}</p>
              </div>
            </div>
            <TimerBar />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <StationPanel />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <TaskList />
              <ControlPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
