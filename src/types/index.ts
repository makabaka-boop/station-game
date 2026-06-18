export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export type TaskType = 'clean' | 'refill';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type MaterialStatus = 'full' | 'partial' | 'empty' | 'missing';

export type EventType = 'missing_material' | 'severe_dirt' | 'guide_delay' | 'early_arrival';

export type PageType = 'menu' | 'game' | 'result' | 'tutorial' | 'scores' | 'levelSelect' | 'replay';

export interface GameEvent {
  type: EventType;
  time: number;
  stationId?: number;
  description: string;
  triggered?: boolean;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  duration: number;
  stationCount: number;
  events: GameEvent[];
  unlockScore: number;
}

export interface Station {
  id: number;
  name: string;
  cleanliness: number;
  materialStatus: MaterialStatus;
  isCritical: boolean;
  isDirty: boolean;
  currentTaskId: string | null;
}

export interface Task {
  id: string;
  type: TaskType;
  stationId: number;
  priority: TaskPriority;
  duration: number;
  progress: number;
  status: TaskStatus;
}

export interface Score {
  levelId: number;
  timestamp: number;
  cleanRate: number;
  refillAccuracy: number;
  delayDuration: number;
  stationUtilization: number;
  totalScore: number;
  stars: number;
}

export interface GameState {
  currentPage: PageType;
  currentLevelId: number | null;
  gameStatus: GameStatus;
  timeRemaining: number;
  stations: Station[];
  tasks: Task[];
  activeEvents: GameEvent[];
  dismissedEventIndices: number[];
  currentScore: Score | null;
  isNextSessionReady: boolean;
  guideDelayTime: number;
  earlyArrivalTime: number;
  currentReplayTimestamp: number | null;
  replayReturnPage: PageType | null;
  taskTimeline: Array<{ taskId: string; type: 'started' | 'completed'; elapsed: number }>;
  eventTimeline: Array<{ eventIndex: number; elapsed: number }>;
  removedTaskSnapshots: Array<{ task: Task; removedAtElapsed: number }>;
}

export interface LocalSaveData {
  unlockedLevels: number[];
  bestScores: Record<number, Score>;
  scoreHistory: Score[];
  replayData: ReplayData[];
}

export interface ReplayEventRecord {
  type: EventType;
  time: number;
  stationId?: number;
  description: string;
  triggeredAtElapsed: number;
}

export interface ReplayTaskRecord {
  id: string;
  type: TaskType;
  stationId: number;
  priority: TaskPriority;
  startedAtElapsed: number | null;
  completedAtElapsed: number | null;
  removed: boolean;
  removedAtElapsed: number | null;
}

export interface ReplayStationState {
  id: number;
  name: string;
  cleanliness: number;
  materialStatus: MaterialStatus;
  isCritical: boolean;
  isDirty: boolean;
}

export interface ReplayData {
  scoreTimestamp: number;
  levelId: number;
  levelDuration: number;
  events: ReplayEventRecord[];
  tasks: ReplayTaskRecord[];
  finalStations: ReplayStationState[];
  scoreBreakdown: {
    cleanRate: number;
    refillAccuracy: number;
    delayDuration: number;
    stationUtilization: number;
    totalScore: number;
  };
}
