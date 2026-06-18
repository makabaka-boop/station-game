import { LocalSaveData, Score, ReplayData } from '@/types';
import { LEVELS } from '@/data/levels';

const STORAGE_KEY = 'station-scheduler-save';

const getDefaultSaveData = (): LocalSaveData => ({
  unlockedLevels: [1],
  bestScores: {},
  scoreHistory: [],
  replayData: [],
});

export const getSaveData = (): LocalSaveData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load save data:', e);
  }
  return getDefaultSaveData();
};

export const saveData = (data: LocalSaveData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

export const getUnlockedLevels = (): number[] => {
  return getSaveData().unlockedLevels;
};

export const getBestScores = (): Record<number, Score> => {
  return getSaveData().bestScores;
};

export const getScoreHistory = (): Score[] => {
  return getSaveData().scoreHistory;
};

export const saveScore = (score: Score): void => {
  const data = getSaveData();
  const existingBest = data.bestScores[score.levelId];

  if (!existingBest || score.totalScore > existingBest.totalScore) {
    data.bestScores[score.levelId] = score;
  }

  data.scoreHistory.unshift(score);
  data.scoreHistory = data.scoreHistory.slice(0, 50);

  const level = LEVELS.find((l) => l.id === score.levelId);
  if (level && score.totalScore >= level.unlockScore) {
    const nextLevelId = score.levelId + 1;
    if (!data.unlockedLevels.includes(nextLevelId) && nextLevelId <= LEVELS.length) {
      data.unlockedLevels.push(nextLevelId);
    }
  }

  saveData(data);
};

export const resetSaveData = (): void => {
  saveData(getDefaultSaveData());
};

export const saveReplayData = (replay: ReplayData): void => {
  const data = getSaveData();
  data.replayData.unshift(replay);
  data.replayData = data.replayData.slice(0, 50);
  saveData(data);
};

export const getReplayByTimestamp = (timestamp: number): ReplayData | null => {
  const data = getSaveData();
  return data.replayData.find((r) => r.scoreTimestamp === timestamp) || null;
};
