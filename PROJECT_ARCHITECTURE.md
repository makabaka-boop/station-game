# 工位调度大师 - 项目业务架构梳理

## 一、项目概述

**工位调度大师**是一个基于 React + TypeScript + Zustand 的前端调度模拟小游戏。玩家扮演工位调度员，在限定时间内合理安排各工位的清洁和补料任务，应对突发状况，争取最高评分。

- **技术栈**：React 18 + TypeScript + Vite + Zustand + TailwindCSS
- **核心玩法**：任务调度 + 时间管理 + 突发事件应对
- **存储方式**：localStorage 本地持久化

---

## 二、整体页面流程

### 2.1 页面流转图

```
主菜单 (menu)
├── 开始游戏 → 关卡选择 (levelSelect) → 游戏页面 (game) → 结算页 (result)
│                                                          ├── 重新挑战
│                                                          ├── 查看复盘 (replay)
│                                                          ├── 下一关
│                                                          └── 返回关卡选择/主菜单
├── 游戏教程 (tutorial)
└── 成绩记录 (scores)
    └── 查看复盘 (replay)
```

### 2.2 各页面职责

| 页面 | 文件路径 | 核心职责 |
|------|---------|---------|
| MainMenu | [MainMenu.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/MainMenu.tsx) | 游戏入口，提供开始游戏、教程、成绩记录入口 |
| LevelSelect | [LevelSelect.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/LevelSelect.tsx) | 展示已解锁关卡，显示关卡信息和历史最高分 |
| GamePage | [GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx) | 游戏主界面，包含工位面板、任务清单、控制面板、计时器 |
| ResultPage | [ResultPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ResultPage.tsx) | 结算页面，展示得分详情、星级、解锁进度 |
| TutorialPage | [TutorialPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/TutorialPage.tsx) | 游戏教程，说明玩法、事件、评分标准 |
| ScoresPage | [ScoresPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ScoresPage.tsx) | 成绩记录，展示关卡进度、历史记录、支持数据重置 |
| ReplayPage | [ReplayPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ReplayPage.tsx) | 复盘页面，展示事件时间线、任务完成顺序、工位最终状态、得分对比 |

---

## 三、核心数据结构

### 3.1 类型定义总览 ([types/index.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/types/index.ts))

```typescript
// 游戏状态机
type GameStatus = 'idle' | 'playing' | 'paused' | 'finished'

// 任务类型 & 优先级 & 状态
type TaskType = 'clean' | 'refill'
type TaskPriority = 'high' | 'medium' | 'low'
type TaskStatus = 'pending' | 'in_progress' | 'completed'

// 物料状态 & 事件类型
type MaterialStatus = 'full' | 'partial' | 'empty' | 'missing'
type EventType = 'missing_material' | 'severe_dirt' | 'guide_delay' | 'early_arrival'
```

### 3.2 核心实体结构

#### Level（关卡配置）
- `id`: 关卡编号
- `name/description`: 名称/描述
- `duration`: 总时长（秒）
- `stationCount`: 工位数量
- `events`: 预设突发事件列表
- `unlockScore`: 解锁下一关所需分数

#### Station（工位状态）
- `id/name`: 工位标识
- `cleanliness`: 清洁度（0-100）
- `materialStatus`: 物料状态（充足/不足/空缺/缺失）
- `isCritical`: 是否为关键工位（评分权重翻倍）
- `isDirty`: 是否重度污损（清洁时间翻倍）
- `currentTaskId`: 当前执行任务ID（未使用）

#### Task（任务）
- `id/type/stationId`: 任务标识
- `priority`: 优先级（高/中/低）
- `duration`: 预计执行时长（秒）
- `progress`: 执行进度（0-100）
- `status`: 任务状态

#### Score（得分记录）
- `levelId/timestamp`: 关联关卡和时间戳
- `cleanRate`: 清理完成率（权重30%）
- `refillAccuracy`: 补料准确率（权重25%）
- `delayDuration`: 延误时长（权重25%）
- `stationUtilization`: 工位利用率（权重20%）
- `totalScore/stars`: 总分及星级（0-3星）

---

## 四、游戏状态管理

### 4.1 Zustand Store 架构 ([store/gameStore.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts))

**核心状态字段**：

| 字段 | 说明 |
|------|------|
| currentPage | 当前页面路由 |
| currentLevelId | 当前关卡ID |
| gameStatus | 游戏状态（idle/playing/paused/finished） |
| timeRemaining | 剩余时间 |
| stations | 工位状态数组 |
| tasks | 任务列表 |
| activeEvents | 当前关卡事件 |
| dismissedEventIndices | 已关闭通知的事件索引 |
| guideDelayTime | 讲解员延迟带来的额外时间（+10s） |
| earlyArrivalTime | 观众提前带来的时间缩减（-15s） |
| taskTimeline | 任务开始/完成时间线（用于复盘） |
| eventTimeline | 事件触发时间线 |
| removedTaskSnapshots | 被删除任务的快照 |
| currentReplayTimestamp | 当前查看复盘的时间戳 |
| replayReturnPage | 复盘后返回的页面 |

### 4.2 状态流转

```
idle (初始)
  ↓ startLevel()
playing (游戏中)
  ├─ pauseGame() → paused
  │   └─ resumeGame() → playing
  ├─ tick() 每秒执行
  │   └─ actualTimeRemaining ≤ 0 → finishGame()
  └─ startNextSession() → finishGame()
                                ↓
finished (已结束) → currentPage: 'result'
```

---

## 五、任务生成与执行机制

### 5.1 任务初始化（startLevel）

关卡开始时自动生成初始任务：

1. **清洁任务自动生成**：工位清洁度 &lt; 80% 时自动创建
   - 关键工位 → 高优先级
   - 重度污损 → 时长 20s，普通污损 → 时长 10s

2. **补料任务自动生成**：物料状态不是 full 时自动创建
   - 物料为空（empty）→ 高优先级
   - 物料不足（partial）→ 中优先级
   - 补料任务固定时长 5s

### 5.2 任务执行引擎（tick 每秒执行）

**核心调度逻辑**：

```
每秒钟 tick 执行流程：
1. 时间递减：timeRemaining - 1
2. 检查并触发突发事件
3. 自动调度任务执行：
   - 最多同时执行 2 个任务（maxParallelTasks = 2）
   - 同一工位不能同时执行多个任务
   - 按任务列表顺序（用户可拖拽排序）选择待执行任务
4. 推进进行中任务的进度：
   - progress += 100 / task.duration
   - progress ≥ 100 时任务完成，更新工位状态
5. 记录时间线数据用于复盘
```

### 5.3 用户操作任务的方式

| 操作 | 位置 | 说明 |
|------|------|------|
| 触发补料 | StationPanel 工位卡片 | 点击"触发补料"按钮添加补料任务 |
| 删除任务 | TaskList 任务项 | 点击 ✕ 按钮删除待执行任务 |
| 拖拽排序 | TaskList 待执行区 | 拖拽调整任务执行顺序 |
| 调整优先级 | TaskList 任务项下拉框 | 设置高/中/低优先级（注：当前调度逻辑按数组顺序执行，优先级标记仅为视觉提示） |

---

## 六、突发事件系统

### 6.1 事件类型及影响

| 事件类型 | 触发效果 | 视觉提示 |
|---------|---------|---------|
| missing_material（材料缺失） | 指定工位 materialStatus 变为 'missing'，需补料 | 红色通知 + 工位红色标记 |
| severe_dirt（重度污损） | 指定工位 isDirty = true，清洁任务时长翻倍 | 橙色通知 + 工位红色边框闪烁 |
| guide_delay（讲解员延迟） | guideDelayTime = +10s（总时间增加10秒） | 绿色通知 + 计时器显示 +10s |
| early_arrival（观众提前） | earlyArrivalTime = 15s（总时间减少15秒） | 黄色通知 + 计时器显示 -15s |

### 6.2 事件触发时机

- 事件配置在关卡数据 `LEVELS` 中，每个事件有 `time` 字段（关卡开始后第几秒触发）
- `tick()` 函数中检测：`elapsed ≥ event.time` 时触发事件
- 触发后通过 `EventNotification` 组件弹出右上角通知，3.5秒后自动消失

### 6.3 实际时间计算

```
actualTimeRemaining = timeRemaining - earlyArrivalTime + guideDelayTime
```

时间线优先级：观众提前扣时间 > 讲解员延迟加时间

---

## 七、得分计算系统

### 7.1 加权公式 ([utils/scoreCalculator.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/scoreCalculator.ts))

```
总分 = 清理完成率 × 0.30
     + 补料准确率 × 0.25
     + (100 - 延误扣分) × 0.25
     + 工位利用率 × 0.20
```

### 7.2 各维度计算详情

#### 1. 清理完成率（cleanRate）
- **关键工位权重 ×2**，普通工位权重 ×1
- 关键工位清洁度 ≥ 90% → 满分，否则按比例计算
- 普通工位清洁度 ≥ 80% → 满分，否则按比例计算

#### 2. 补料准确率（refillAccuracy）
- 基础分 = 已完成补料任务数 / 补料任务总数 × 100
- 物料奖励分 = 物料充足工位数 / 总工位数 × 100
- 最终 = (基础分 + 物料奖励分) / 2

#### 3. 延误时长（delayDuration/延误扣分）
- 点击"开始下一场"提前结束：`延误 = max(0, 实际用时 - 关卡时长)`，扣分为 `延误 × 3`
- 时间耗尽自然结束：`延误 = 10s` 基础惩罚 + 超时时间，扣分为 `延误 × 2`
- 得分项：`(100 - 延误扣分)`，延误越少得分越高

#### 4. 工位利用率（stationUtilization）
- 有完成任务的工位视为"被利用"
- **关键工位权重 ×2**，普通工位权重 ×1
- 利用率 = 被利用工位数（加权） / 总工位数（加权）

### 7.3 星级评定

| 总分 | 星级 |
|------|------|
| ≥ 90 | ★★★ 三星 |
| ≥ 70 | ★★ 二星 |
| ≥ 50 | ★ 一星 |
| &lt; 50 | 无星 |

---

## 八、本地存储与历史记录

### 8.1 存储结构 ([utils/storage.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts))

存储 Key：`station-scheduler-save`

```typescript
interface LocalSaveData {
  unlockedLevels: number[];      // 已解锁关卡ID列表
  bestScores: Record&lt;number, Score&gt;;  // 各关卡最高分
  scoreHistory: Score[];         // 历史成绩记录（最多50条）
  replayData: ReplayData[];      // 复盘数据（最多50条）
}
```

### 8.2 关卡解锁机制

- 初始只解锁关卡 1
- 完成关卡时，若总分 ≥ `level.unlockScore`，自动解锁下一关
- 各关卡解锁分数线：
  - 关卡1：60分
  - 关卡2：70分
  - 关卡3：75分
  - 关卡4：80分

### 8.3 复盘数据记录

游戏结束时自动记录以下数据用于复盘：

1. **事件记录**：事件类型、触发时间、描述
2. **任务记录**：开始时间、完成时间、是否被删除、删除时间
3. **工位最终状态**：清洁度、物料状态、是否污损
4. **得分明细**：各维度得分及总分

---

## 九、组件架构

### 9.1 游戏页面布局

```
GamePage
├── EventNotification（右上角事件通知，fixed定位）
├── 顶部：关卡信息 + TimerBar（计时器进度条）
└── 主体（3列布局）
    ├── 左列（1/3）：StationPanel（工位状态面板）
    │   └── StationCard × N（每个工位卡片）
    └── 右列（2/3）
        ├── TaskList（任务清单）
        │   └── TaskItem × N（拖拽排序任务项）
        └── ControlPanel（控制面板：暂停/继续/开始下一场/返回）
```

### 9.2 核心组件说明

| 组件 | 职责 |
|------|------|
| StationPanel/StationCard | 展示工位清洁度、物料状态，提供"触发补料"按钮 |
| TaskList/TaskItem | 分状态展示任务（进行中/待执行/已完成），支持拖拽排序、删除、改优先级 |
| TimerBar | 显示剩余时间，带进度条和颜色提示（蓝→黄→红），展示加减时间标签 |
| ControlPanel | 暂停/继续、提前结束、返回菜单 |
| EventNotification | 事件触发时右上角弹出通知，自动消失 |

---

## 十、关卡配置详情 ([data/levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts))

| 关卡 | 名称 | 时长 | 工位数 | 特殊事件 | 解锁分 |
|------|------|------|--------|---------|--------|
| 1 | 新手入门 | 90s | 3 | 无 | 60 |
| 2 | 材料危机 | 80s | 4 | 50s时2号工位材料缺失 | 70 |
| 3 | 清洁挑战 | 70s | 5 | 40s时3号工位重度污损 | 75 |
| 4 | 双重压力 | 60s | 5 | 30s观众提前(-15s)，45s讲解员延迟(+10s) | 80 |

工位名称默认配置：接待台、展示区A、互动区B、体验区C、休息区D，第一个工位默认是关键工位。

---

## 十一、后续可扩展位置

### 11.1 功能扩展点

| 位置 | 可扩展内容 |
|------|-----------|
| **任务调度逻辑** | 当前按数组顺序执行，可加入真正的优先级调度（高优先级插队）、任务依赖关系、工位类型限制 |
| **任务类型** | 当前只有 clean/refill，可扩展：设备检修、物料搬运、人员协调等 |
| **事件系统** | 可扩展更多事件类型：设备故障、人员请假、临时加急任务；可加入随机事件而非固定时间触发 |
| **工位类型** | 当前 isCritical 只是权重标记，可扩展不同工位类型有不同的任务时长、不同的物料消耗速度 |
| **多关卡/难度** | LEVELS 数组可轻松扩展，加入更多关卡、难度等级、无尽模式 |
| **成就系统** | 基于 scoreHistory 可添加成就：全三星通关、零延误通关、零删除任务等 |
| **音效/动画** | 可添加任务完成音效、事件警报音效、更丰富的过渡动画 |
| **教程交互** | 当前是静态说明，可添加交互式引导教程 |
| **任务生成** | 当前初始化后任务不会自动新增，可加入：随时间推移工位自动变脏、物料自动消耗，需要持续调度 |
| **多人/排行榜** | 当前是本地存储，可扩展云端存储、好友排行 |

### 11.2 已知可优化点

1. **优先级调度**：TaskPriority 目前只在 UI 显示，`tick()` 中的自动调度没有按优先级排序，只按数组顺序取任务
2. **currentTaskId 字段**：Station 上的 currentTaskId 定义了但未被使用
3. **isNextSessionReady 逻辑**：提前结束的延误计算可更精细
4. **任务进度实时性**：进度是按秒跳变，可以改成更平滑的动画

### 11.3 核心文件索引

| 功能 | 文件 |
|------|------|
| 类型定义 | [src/types/index.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/types/index.ts) |
| 状态管理 | [src/store/gameStore.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts) |
| 关卡配置 | [src/data/levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts) |
| 得分计算 | [src/utils/scoreCalculator.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/scoreCalculator.ts) |
| 本地存储 | [src/utils/storage.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts) |
| 游戏主页面 | [src/pages/GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx) |
| 工位组件 | [src/components/StationPanel.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/StationPanel.tsx) |
| 任务列表 | [src/components/TaskList.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TaskList.tsx) |
| 复盘页面 | [src/pages/ReplayPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ReplayPage.tsx) |
