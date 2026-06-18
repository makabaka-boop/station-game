import { create } from 'zustand';
import { GameState, Task, Station, TaskPriority, Score, ReplayData } from '@/types';
import { LEVELS, getInitialStations, STATION_NAMES } from '@/data/levels';
import { saveScore, getUnlockedLevels, getBestScores, saveReplayData } from '@/utils/storage';
import { calculateScore } from '@/utils/scoreCalculator';

interface GameStore extends GameState {
  navigateTo: (page: GameState['currentPage']) => void;
  startLevel: (levelId: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tick: () => void;
  addTask: (stationId: number, type: 'clean' | 'refill') => void;
  removeTask: (taskId: string) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  changeTaskPriority: (taskId: string, priority: TaskPriority) => void;
  triggerRefill: (stationId: number) => void;
  startNextSession: () => void;
  finishGame: () => void;
  dismissEvent: (index: number) => void;
  getUnlockedLevels: () => number[];
  getBestScores: () => Record<number, Score>;
  viewReplay: (timestamp: number) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  currentPage: 'menu',
  currentLevelId: null,
  gameStatus: 'idle',
  timeRemaining: 0,
  stations: [],
  tasks: [],
  activeEvents: [],
  dismissedEventIndices: [],
  currentScore: null,
  isNextSessionReady: false,
  guideDelayTime: 0,
  earlyArrivalTime: 0,
  currentReplayTimestamp: null,
  replayReturnPage: null,
  taskTimeline: [],
  eventTimeline: [],
  removedTaskSnapshots: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  navigateTo: (page) => set({ currentPage: page }),

  startLevel: (levelId) => {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;

    const stations = getInitialStations(level.stationCount);
    const tasks: Task[] = [];

    stations.forEach((station) => {
      if (station.cleanliness < 80) {
        tasks.push({
          id: `clean-${station.id}`,
          type: 'clean',
          stationId: station.id,
          priority: station.isCritical ? 'high' : 'medium',
          duration: station.isDirty ? 20 : 10,
          progress: 0,
          status: 'pending',
        });
      }
      if (station.materialStatus !== 'full') {
        tasks.push({
          id: `refill-${station.id}`,
          type: 'refill',
          stationId: station.id,
          priority: station.materialStatus === 'empty' ? 'high' : 'medium',
          duration: 5,
          progress: 0,
          status: 'pending',
        });
      }
    });

    set({
      currentPage: 'game',
      currentLevelId: levelId,
      gameStatus: 'playing',
      timeRemaining: level.duration,
      stations,
      tasks,
      activeEvents: level.events.map((e) => ({ ...e, triggered: false })),
      dismissedEventIndices: [],
      currentScore: null,
      isNextSessionReady: false,
      guideDelayTime: 0,
      earlyArrivalTime: 0,
      currentReplayTimestamp: null,
      replayReturnPage: null,
      taskTimeline: [],
      eventTimeline: [],
      removedTaskSnapshots: [],
    });
  },

  pauseGame: () => set({ gameStatus: 'paused' }),

  resumeGame: () => set({ gameStatus: 'playing' }),

  tick: () => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    let { timeRemaining, stations, tasks, activeEvents, guideDelayTime, earlyArrivalTime } = state;
    const { taskTimeline, eventTimeline } = state;
    const level = LEVELS.find((l) => l.id === state.currentLevelId);
    if (!level) return;

    const elapsed = level.duration - timeRemaining;

    const actualTimeRemaining = timeRemaining - earlyArrivalTime + guideDelayTime;

    if (actualTimeRemaining <= 0) {
      get().finishGame();
      return;
    }

    const newEventTimeline = [...eventTimeline];

    activeEvents = activeEvents.map((event, index) => {
      if (!event.triggered && level.duration - timeRemaining >= event.time) {
        if (event.type === 'severe_dirt' && event.stationId) {
          stations = stations.map((s) =>
            s.id === event.stationId ? { ...s, isDirty: true } : s
          );
          tasks = tasks.map((t) =>
            t.type === 'clean' && t.stationId === event.stationId
              ? { ...t, duration: t.duration * 2 }
              : t
          );
        }
        if (event.type === 'missing_material' && event.stationId) {
          stations = stations.map((s) =>
            s.id === event.stationId ? { ...s, materialStatus: 'missing' } : s
          );
        }
        if (event.type === 'guide_delay') {
          guideDelayTime = 10;
        }
        if (event.type === 'early_arrival') {
          earlyArrivalTime = 15;
        }
        newEventTimeline.push({ eventIndex: index, elapsed });
        return { ...event, triggered: true };
      }
      return event;
    });

    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
    const maxParallelTasks = 2;

    const activeStationIds = new Set(
      inProgressTasks.map((t) => t.stationId)
    );

    const newTaskTimeline = [...taskTimeline];

    if (inProgressTasks.length < maxParallelTasks && pendingTasks.length > 0) {
      const availablePending = pendingTasks.filter(
        (t) => !activeStationIds.has(t.stationId)
      );

      const toStart = availablePending.slice(0, maxParallelTasks - inProgressTasks.length);
      if (toStart.length > 0) {
        const toStartIds = new Set(toStart.map((s) => s.id));
        tasks = tasks.map((t) =>
          toStartIds.has(t.id) ? { ...t, status: 'in_progress' } : t
        );
        toStart.forEach((t) => {
          newTaskTimeline.push({ taskId: t.id, type: 'started', elapsed });
        });
      }
    }

    tasks = tasks.map((task) => {
      if (task.status === 'in_progress') {
        const newProgress = Math.min(100, task.progress + (100 / task.duration));
        if (newProgress >= 100) {
          const station = stations.find((s) => s.id === task.stationId);
          if (task.type === 'clean') {
            stations = stations.map((s) =>
              s.id === task.stationId ? { ...s, cleanliness: 100, isDirty: false } : s
            );
          }
          if (task.type === 'refill') {
            stations = stations.map((s) =>
              s.id === task.stationId ? { ...s, materialStatus: 'full' } : s
            );
          }
          newTaskTimeline.push({ taskId: task.id, type: 'completed', elapsed });
          return { ...task, progress: 100, status: 'completed' };
        }
        return { ...task, progress: newProgress };
      }
      return task;
    });

    set({
      timeRemaining: timeRemaining - 1,
      stations,
      tasks,
      activeEvents,
      guideDelayTime,
      earlyArrivalTime,
      taskTimeline: newTaskTimeline,
      eventTimeline: newEventTimeline,
    });
  },

  addTask: (stationId, type) => {
    const { tasks, stations } = get();
    const station = stations.find((s) => s.id === stationId);
    if (!station) return;

    const existingTask = tasks.find((t) => t.stationId === stationId && t.type === type);
    if (existingTask) return;

    const newTask: Task = {
      id: `${type}-${stationId}-${Date.now()}`,
      type,
      stationId,
      priority: type === 'clean' && station.cleanliness < 30 ? 'high' : 'medium',
      duration: type === 'clean' ? (station.isDirty ? 20 : 10) : 5,
      progress: 0,
      status: 'pending',
    };

    set({ tasks: [...tasks, newTask] });
  },

  removeTask: (taskId) => {
    const { tasks, removedTaskSnapshots, currentLevelId } = get();
    const taskToRemove = tasks.find((t) => t.id === taskId);
    const level = LEVELS.find((l) => l.id === currentLevelId);
    if (!taskToRemove || !level) {
      set({ tasks: tasks.filter((t) => t.id !== taskId) });
      return;
    }
    const elapsed = level.duration - get().timeRemaining;
    set({
      tasks: tasks.filter((t) => t.id !== taskId),
      removedTaskSnapshots: [...removedTaskSnapshots, { task: taskToRemove, removedAtElapsed: elapsed }],
    });
  },

  reorderTasks: (startIndex, endIndex) => {
    const { tasks } = get();
    const result = Array.from(tasks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    set({ tasks: result });
  },

  changeTaskPriority: (taskId, priority) => {
    const { tasks } = get();
    set({
      tasks: tasks.map((t) => (t.id === taskId ? { ...t, priority } : t)),
    });
  },

  triggerRefill: (stationId) => {
    const { stations, tasks } = get();
    const station = stations.find((s) => s.id === stationId);
    if (!station) return;

    const existingTask = tasks.find(
      (t) => t.type === 'refill' && t.stationId === stationId && t.status !== 'completed'
    );
    if (existingTask) return;

    get().addTask(stationId, 'refill');
  },

  startNextSession: () => {
    set({ isNextSessionReady: true });
    get().finishGame();
  },

  finishGame: () => {
    const state = get();
    const level = LEVELS.find((l) => l.id === state.currentLevelId);
    if (!level) return;

    const elapsedTime = level.duration - state.timeRemaining;
    const delayDuration = state.isNextSessionReady
      ? Math.max(0, elapsedTime - level.duration)
      : Math.max(0, level.duration - state.timeRemaining + 10);

    const score = calculateScore({
      stations: state.stations,
      tasks: state.tasks,
      delayDuration,
      isNextSessionReady: state.isNextSessionReady,
    });

    const finalScore: Score = {
      ...score,
      levelId: level.id,
      timestamp: Date.now(),
    };

    saveScore(finalScore);

    const taskStartMap = new Map<string, number>();
    const taskCompleteMap = new Map<string, number>();
    state.taskTimeline.forEach((entry) => {
      if (entry.type === 'started') taskStartMap.set(entry.taskId, entry.elapsed);
      if (entry.type === 'completed') taskCompleteMap.set(entry.taskId, entry.elapsed);
    });

    const removedAtMap = new Map<string, number>();
    state.removedTaskSnapshots.forEach((entry) => {
      removedAtMap.set(entry.task.id, entry.removedAtElapsed);
    });

    const allTaskIds = new Set([
      ...state.tasks.map((t) => t.id),
      ...state.removedTaskSnapshots.map((r) => r.task.id),
    ]);

    const removedTaskMap = new Map(
      state.removedTaskSnapshots.map((r) => [r.task.id, r.task])
    );

    const replayTasks = Array.from(allTaskIds).map((taskId) => {
      const task = state.tasks.find((t) => t.id === taskId) || removedTaskMap.get(taskId);
      if (!task) return null;
      return {
        id: task.id,
        type: task.type,
        stationId: task.stationId,
        priority: task.priority,
        startedAtElapsed: taskStartMap.get(task.id) ?? null,
        completedAtElapsed: taskCompleteMap.get(task.id) ?? null,
        removed: removedAtMap.has(task.id),
        removedAtElapsed: removedAtMap.get(task.id) ?? null,
      };
    }).filter(Boolean) as ReplayData['tasks'];

    const replayEvents = state.activeEvents
      .filter((e) => e.triggered)
      .map((e, idx) => {
        const timelineEntry = state.eventTimeline.find(
          (te) => te.eventIndex === state.activeEvents.indexOf(e)
        );
        return {
          type: e.type,
          time: e.time,
          stationId: e.stationId,
          description: e.description,
          triggeredAtElapsed: timelineEntry?.elapsed ?? e.time,
        };
      });

    const replay: ReplayData = {
      scoreTimestamp: finalScore.timestamp,
      levelId: level.id,
      levelDuration: level.duration,
      events: replayEvents,
      tasks: replayTasks,
      finalStations: state.stations.map((s) => ({
        id: s.id,
        name: s.name,
        cleanliness: s.cleanliness,
        materialStatus: s.materialStatus,
        isCritical: s.isCritical,
        isDirty: s.isDirty,
      })),
      scoreBreakdown: {
        cleanRate: finalScore.cleanRate,
        refillAccuracy: finalScore.refillAccuracy,
        delayDuration: finalScore.delayDuration,
        stationUtilization: finalScore.stationUtilization,
        totalScore: finalScore.totalScore,
      },
    };

    saveReplayData(replay);

    set({
      gameStatus: 'finished',
      currentScore: finalScore,
      currentPage: 'result',
    });
  },

  dismissEvent: (index) => {
    const { dismissedEventIndices } = get();
    if (!dismissedEventIndices.includes(index)) {
      set({ dismissedEventIndices: [...dismissedEventIndices, index] });
    }
  },

  getUnlockedLevels: () => getUnlockedLevels(),

  getBestScores: () => getBestScores(),

  viewReplay: (timestamp: number) => {
    const { currentPage } = get();
    set({
      currentReplayTimestamp: timestamp,
      replayReturnPage: currentPage,
      currentPage: 'replay',
    });
  },

  resetGame: () => set(initialState),
}));
