import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Task, TaskPriority } from '@/types';

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: '高', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/50' },
  medium: { label: '中', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/50' },
  low: { label: '低', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/50' },
};

interface TaskItemProps {
  task: Task;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number;
}

const TaskItem = ({
  task,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: TaskItemProps) => {
  const { stations, changeTaskPriority, removeTask } = useGameStore();
  const station = stations.find((s) => s.id === task.stationId);

  const isAbove = dragOverIndex === index && !isDragging;

  return (
    <div
      draggable={task.status === 'pending'}
      onDragStart={() => task.status === 'pending' && onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        task.status === 'pending' && onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={`relative p-3 rounded-lg border transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isAbove ? 'border-t-4 border-t-blue-500' : ''} ${
        task.status === 'pending'
          ? `bg-slate-800 border-slate-600 cursor-grab active:cursor-grabbing hover:border-slate-500 ${priorityConfig[task.priority].bgColor}`
          : task.status === 'in_progress'
          ? 'bg-slate-800 border-cyan-500'
          : 'bg-slate-900/50 border-slate-700 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {task.type === 'clean' ? '🧹' : '📦'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {task.type === 'clean' ? '清理' : '补料'} - {station?.name}
              </span>
              {station?.isCritical && (
                <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">
                  关键
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400">
              预计 {task.duration}秒
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.status === 'pending' && (
            <>
              <select
                value={task.priority}
                onChange={(e) => changeTaskPriority(task.id, e.target.value as TaskPriority)}
                className={`text-xs px-2 py-1 rounded border ${priorityConfig[task.priority].color} ${priorityConfig[task.priority].bgColor} bg-transparent`}
              >
                <option value="high">高优先</option>
                <option value="medium">中优先</option>
                <option value="low">低优先</option>
              </select>
              <button
                onClick={() => removeTask(task.id)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </>
          )}

          {task.status === 'in_progress' && (
            <span className="text-cyan-400 text-sm animate-pulse">
              执行中 {Math.round(task.progress)}%
            </span>
          )}

          {task.status === 'completed' && (
            <span className="text-green-400 text-sm">✓ 已完成</span>
          )}
        </div>
      </div>

      {task.status === 'in_progress' && (
        <div className="mt-2">
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const TaskList = () => {
  const { tasks, reorderTasks } = useGameStore();
  const [dragIndex, setDragIndex] = useState<number>(-1);
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== -1 && dragOverIndex !== -1 && dragIndex !== dragOverIndex) {
      const pendingStartIndex = tasks.findIndex((t) => t.status === 'pending');
      reorderTasks(pendingStartIndex + dragIndex, pendingStartIndex + dragOverIndex);
    }
    setDragIndex(-1);
    setDragOverIndex(-1);
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>📋</span> 任务清单
        <span className="text-sm font-normal text-slate-400">
          (拖拽排序优先级)
        </span>
      </h3>

      <div className="space-y-4">
        {inProgressTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-cyan-400 mb-2">进行中</h4>
            <div className="space-y-2">
              {inProgressTasks.map((task, i) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={i}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnd={() => {}}
                  isDragging={false}
                  dragOverIndex={-1}
                />
              ))}
            </div>
          </div>
        )}

        {pendingTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">
              待执行 ({pendingTasks.length})
            </h4>
            <div className="space-y-2">
              {pendingTasks.map((task, i) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={i}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  isDragging={dragIndex === i}
                  dragOverIndex={dragOverIndex}
                />
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-2">
              已完成 ({completedTasks.length})
            </h4>
            <div className="space-y-2">
              {completedTasks.map((task, i) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={i}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnd={() => {}}
                  isDragging={false}
                  dragOverIndex={-1}
                />
              ))}
            </div>
          </div>
        )}

        {pendingTasks.length === 0 && inProgressTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
};
