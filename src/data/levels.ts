import { Level, MaterialStatus } from '@/types';

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '新手入门',
    description: '熟悉基本操作，在90秒内完成3个工位的清理和补料',
    duration: 90,
    stationCount: 3,
    events: [],
    unlockScore: 60,
  },
  {
    id: 2,
    name: '材料危机',
    description: '处理材料包缺件问题，合理安排补料优先级',
    duration: 80,
    stationCount: 4,
    events: [
      {
        type: 'missing_material',
        time: 50,
        stationId: 2,
        description: '⚠️ 2号工位材料包缺失！需要优先补料',
      },
    ],
    unlockScore: 70,
  },
  {
    id: 3,
    name: '清洁挑战',
    description: '某工位污损严重，需要优先处理重度污损工位',
    duration: 70,
    stationCount: 5,
    events: [
      {
        type: 'severe_dirt',
        time: 40,
        stationId: 3,
        description: '💩 3号工位污损严重！清洁时间加倍',
      },
    ],
    unlockScore: 75,
  },
  {
    id: 4,
    name: '双重压力',
    description: '讲解员延迟+下一场提前到达，灵活调整时间安排',
    duration: 60,
    stationCount: 5,
    events: [
      {
        type: 'guide_delay',
        time: 45,
        description: '⏰ 讲解员临时延迟10秒到达',
      },
      {
        type: 'early_arrival',
        time: 30,
        description: '🚨 下一场观众提前到达！时间紧迫',
      },
    ],
    unlockScore: 80,
  },
];

export const STATION_NAMES = [
  '接待台',
  '展示区A',
  '互动区B',
  '体验区C',
  '休息区D',
];

export const getInitialStations = (count: number) => {
  const stations = [];
  const materialStatuses: MaterialStatus[] = ['partial', 'empty', 'partial'];
  for (let i = 0; i < count; i++) {
    stations.push({
      id: i + 1,
      name: STATION_NAMES[i] || `工位${i + 1}`,
      cleanliness: Math.floor(Math.random() * 40) + 20,
      materialStatus: materialStatuses[Math.floor(Math.random() * 3)],
      isCritical: i === 0,
      isDirty: false,
      currentTaskId: null,
    });
  }
  return stations;
};
