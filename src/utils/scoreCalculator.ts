import { Station, Task, Score } from '@/types';

interface ScoreInput {
  stations: Station[];
  tasks: Task[];
  delayDuration: number;
  isNextSessionReady: boolean;
}

interface ScoreResult extends Omit<Score, 'levelId' | 'timestamp'> {}

export const calculateScore = ({
  stations,
  tasks,
  delayDuration,
  isNextSessionReady,
}: ScoreInput): ScoreResult => {
  const cleanRate = calculateCleanRate(stations);
  const refillAccuracy = calculateRefillAccuracy(stations, tasks);
  const stationUtilization = calculateStationUtilization(stations, tasks);
  const delayScore = calculateDelayScore(delayDuration, isNextSessionReady);

  const weightedScore =
    cleanRate * 0.3 + refillAccuracy * 0.25 + (100 - delayScore) * 0.25 + stationUtilization * 0.2;

  const totalScore = Math.round(weightedScore);
  const stars = calculateStars(totalScore);

  return {
    cleanRate: Math.round(cleanRate),
    refillAccuracy: Math.round(refillAccuracy),
    delayDuration: Math.round(delayDuration),
    stationUtilization: Math.round(stationUtilization),
    totalScore,
    stars,
  };
};

const calculateCleanRate = (stations: Station[]): number => {
  if (stations.length === 0) return 0;

  const criticalStations = stations.filter((s) => s.isCritical);
  const normalStations = stations.filter((s) => !s.isCritical);

  let totalWeight = 0;
  let totalScore = 0;

  criticalStations.forEach((station) => {
    totalWeight += 2;
    totalScore += station.cleanliness >= 90 ? 2 : (station.cleanliness / 90) * 2;
  });

  normalStations.forEach((station) => {
    totalWeight += 1;
    totalScore += station.cleanliness >= 80 ? 1 : station.cleanliness / 80;
  });

  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
};

const calculateRefillAccuracy = (stations: Station[], tasks: Task[]): number => {
  const refillTasks = tasks.filter((t) => t.type === 'refill');
  if (refillTasks.length === 0) return 100;

  const completedRefills = refillTasks.filter((t) => t.status === 'completed');
  const stationsWithFullMaterial = stations.filter((s) => s.materialStatus === 'full');

  const baseAccuracy = (completedRefills.length / refillTasks.length) * 100;
  const materialBonus = (stationsWithFullMaterial.length / stations.length) * 100;

  return (baseAccuracy + materialBonus) / 2;
};

const calculateDelayScore = (delayDuration: number, isNextSessionReady: boolean): number => {
  if (!isNextSessionReady) {
    return Math.min(100, delayDuration * 2);
  }
  return Math.max(0, delayDuration * 3);
};

const calculateStationUtilization = (stations: Station[], tasks: Task[]): number => {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const stationsWithWork = new Set(completedTasks.map((t) => t.stationId));

  const criticalStations = stations.filter((s) => s.isCritical);
  const criticalWithWork = criticalStations.filter((s) => stationsWithWork.has(s.id));

  const normalStations = stations.filter((s) => !s.isCritical);
  const normalWithWork = normalStations.filter((s) => stationsWithWork.has(s.id));

  let totalWeight = 0;
  let utilizedWeight = 0;

  criticalStations.forEach(() => {
    totalWeight += 2;
  });
  criticalWithWork.forEach(() => {
    utilizedWeight += 2;
  });

  normalStations.forEach(() => {
    totalWeight += 1;
  });
  normalWithWork.forEach(() => {
    utilizedWeight += 1;
  });

  return totalWeight > 0 ? (utilizedWeight / totalWeight) * 100 : 0;
};

const calculateStars = (totalScore: number): number => {
  if (totalScore >= 90) return 3;
  if (totalScore >= 70) return 2;
  if (totalScore >= 50) return 1;
  return 0;
};
