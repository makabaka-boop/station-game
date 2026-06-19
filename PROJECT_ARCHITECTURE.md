# 工位调度大师 - 项目业务架构梳理

## 一、项目概述

这是一个基于 **React 18 + TypeScript + Zustand** 的前端调度小游戏。玩家扮演场馆运营者，需要在限定时间内合理调度多个工位的**清洁**和**补料**任务，同时应对各种突发事件，最终获得评分并解锁新关卡。游戏核心围绕"时间管理"和"任务优先级决策"展开。

### 技术栈
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand（单一全局 Store）
- **路由**: 页面状态由 Store 管理（非 react-router 路由切换）
- **样式**: Tailwind CSS
- **持久化**: localStorage
- **构建**: Vite

---

## 二、整体页面流程

```
主菜单(menu)
  ├─ 开始游戏 → 关卡选择(levelSelect) → 游戏界面(game) → 结算页面(result)
  │                                                          ├─ 重新挑战
  │                                                          ├─ 查看复盘(replay)
  │                                                          ├─ 下一关
  │                                                          └─ 返回关卡选择/主菜单
  ├─ 游戏教程(tutorial)
  └─ 成绩记录(scores)
       └─ 点击历史记录 → 复盘页面(replay)
```

### 页面流转核心
页面切换通过 Zustand Store 中的 `currentPage` 字段控制，在 [App.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/App.tsx#L10-L35) 中根据此字段渲染对应页面组件。这不是 SPA 路由，而是简单的状态驱动视图切换。

---

## 三、核心数据结构

所有类型定义集中在 [types/index.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/types/index.ts)。

### 3.1 游戏核心实体

| 实体 | 关键字段 | 说明 |
|------|---------|------|
| **Level** | id, name, duration, stationCount, events[], unlockScore | 关卡配置，包含时长、工位数、预设事件、解锁分数 |
| **Station** | id, name, cleanliness, materialStatus, isCritical, isDirty | 工位，包含清洁度(0-100)、物料状态、是否关键工位 |
| **Task** | id, type(clean/refill), stationId, priority, duration, progress, status | 任务，类型、优先级、耗时、进度、状态(pending/in_progress/completed) |
| **GameEvent** | type, time, stationId, description, triggered | 突发事件，有触发时间和触发状态 |
| **Score** | levelId, timestamp, cleanRate, refillAccuracy, delayDuration, stationUtilization, totalScore, stars | 得分记录，包含各维度评分和星级 |

### 3.2 物料状态 (MaterialStatus)
- `full`: 充足
- `partial`: 部分不足
- `empty`: 空缺
- `missing`: 缺失（突发事件触发）

### 3.3 事件类型 (EventType)
- `missing_material`: 材料包缺失 → 需要优先补料
- `severe_dirt`: 重度污损 → 清洁时间加倍
- `guide_delay`: 讲解员延迟 → 额外获得 10 秒
- `early_arrival`: 观众提前到达 → 时间减少 15 秒

### 3.4 游戏状态 (GameState)
核心状态字段：
- `currentPage`: 当前页面
- `gameStatus`: idle / playing / paused / finished
- `timeRemaining`: 剩余时间（秒）
- `stations[]`: 工位列表
- `tasks[]`: 任务列表
- `activeEvents[]`: 当前关卡的事件列表
- `guideDelayTime` / `earlyArrivalTime`: 事件带来的时间增减
- `taskTimeline[]` / `eventTimeline[]`: 任务和事件时间线（用于复盘）
- `removedTaskSnapshots[]`: 被删除任务的快照（用于复盘）

---

## 四、游戏状态流转

### 4.1 关卡启动流程
[gameStore.ts - startLevel()](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L52-L103)

1. 根据 `levelId` 查找关卡配置
2. 调用 `getInitialStations()` 初始化工位：
   - 清洁度随机 20-60 之间
   - 物料状态随机（partial/empty/partial）
   - 第一个工位固定为**关键工位**（isCritical = true）
3. 自动生成初始任务：
   - 清洁度 < 80% 的工位 → 生成清理任务
     - 关键工位优先级设为 high
     - 污损工位耗时 20 秒，普通 10 秒
   - 物料不满的工位 → 生成补料任务
     - 空物料优先级设为 high
     - 固定耗时 5 秒
4. 设置初始状态，切换到 game 页面

### 4.2 游戏主循环 (Tick)
[gameStore.ts - tick()](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L109-L218)

由 [GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx#L14-L22) 中的 `setInterval` 每秒调用一次：

```
每秒执行：
1. 检查游戏状态是否为 playing，否则返回
2. 计算实际剩余时间 = timeRemaining - earlyArrivalTime + guideDelayTime
   → 若 ≤ 0，调用 finishGame() 结束
3. 处理事件触发：
   遍历所有未触发事件，当 elapsed ≥ event.time 时触发：
   - severe_dirt: 标记工位 isDirty=true，对应清理任务 duration ×2
   - missing_material: 标记工位 materialStatus='missing'
   - guide_delay: guideDelayTime = 10
   - early_arrival: earlyArrivalTime = 15
4. 任务调度逻辑：
   - 最多并行执行 2 个任务 (maxParallelTasks = 2)
   - 同一工位不能同时执行多个任务
   - 按 tasks 数组顺序（用户可拖拽排序）取待执行任务启动
5. 任务进度更新：
   - in_progress 任务 progress += 100 / duration
   - progress ≥ 100 时标记为 completed：
     * clean 任务 → 工位 cleanliness = 100, isDirty = false
     * refill 任务 → 工位 materialStatus = 'full'
6. 更新 timeRemaining -= 1，记录时间线
```

### 4.3 游戏结束
[gameStore.ts - finishGame()](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L289-L395)

1. 计算延误时长 (delayDuration)：
   - 若玩家点击"开始下一场"(isNextSessionReady=true)：延误 = max(0, 已用时间 - 关卡时长)
   - 否则（时间耗尽）：延误 = max(0, 关卡时长 - 剩余时间 + 10)
2. 调用 `calculateScore()` 计算四维评分
3. 保存分数到 localStorage（更新最佳分、历史记录、解锁关卡）
4. 构建 ReplayData（复盘数据）并保存
5. 切换到 result 页面

---

## 五、任务系统详解

### 5.1 任务生成

**自动生成时机**：
- 关卡开始时，根据工位初始状态生成
- 突发事件触发时可能影响已有任务（重度污损使清洁时间加倍）

**手动添加**：
- 玩家点击工位卡片上的"触发补料"按钮 → 调用 `addTask()` 添加补料任务
- 玩家也可以删除任务（点击 ✕ 按钮）

### 5.2 任务调度策略

核心调度逻辑在 [gameStore.ts tick()](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L158-L183)：

```
约束条件：
  ├─ 最多同时执行 2 个任务
  └─ 同一工位同时只能有 1 个任务在执行

执行顺序：
  tasks 数组的顺序就是调度优先级顺序
  玩家可通过拖拽调整数组顺序，从而控制执行优先级
```

**注意**：当前代码中 `priority` 字段（high/medium/low）**仅用于UI显示**，并不影响实际调度顺序！实际调度完全由 tasks 数组顺序（即玩家拖拽排序的结果）决定。这是一个潜在的优化点。

### 5.3 玩家可执行的任务操作

| 操作 | 说明 | 影响 |
|------|------|------|
| **拖拽排序** | 拖动待执行任务调整顺序 | 改变任务启动先后顺序 |
| **调整优先级** | 下拉选择高/中/低 | 仅改变显示颜色，不影响调度 |
| **删除任务** | 点击 ✕ 删除待执行任务 | 任务不执行，被记入复盘 |
| **触发补料** | 在工位卡片点击按钮 | 新增补料任务 |
| **开始下一场** | 点击控制面板按钮 | 提前结束游戏，减少延误扣分 |

### 5.4 任务耗时

| 任务类型 | 普通耗时 | 特殊情况 |
|---------|---------|---------|
| 清理(clean) | 10秒 | 重度污损(isDirty=true) → 20秒 |
| 补料(refill) | 5秒 | 固定 |

---

## 六、突发事件系统

事件在 [levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts#L3-L65) 中按关卡配置，每个事件有预设的触发时间点 `time`（关卡开始后的第几秒）。

### 6.1 事件触发机制

事件不是随机发生的，而是**预设在关卡配置中的固定时间点触发**。tick() 函数每秒检查是否有事件到达触发时间。

### 6.2 四种事件效果

| 事件 | 效果 | 对玩家的影响 |
|------|------|-------------|
| **材料缺失** (missing_material) | 指定工位 materialStatus = 'missing' | 该工位物料状态变为"缺失"，需要补料才能恢复 |
| **重度污损** (severe_dirt) | 指定工位 isDirty = true，已有清理任务 duration ×2 | 正在进行/等待的清理任务耗时加倍，需要更长时间 |
| **讲解延迟** (guide_delay) | guideDelayTime = 10 | **好事件**：实际可用时间增加 10 秒 |
| **提前到达** (early_arrival) | earlyArrivalTime = 15 | **坏事件**：实际可用时间减少 15 秒，相当于倒计时加速 |

### 6.3 时间计算公式

**实际剩余时间** = 原始剩余时间 - 提前到达(15s) + 讲解延迟(10s)

这个值在 [TimerBar.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TimerBar.tsx#L10) 和 tick() 中都会计算。

### 6.4 事件通知
事件触发时，右上角会弹出 [EventNotification](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/EventNotification.tsx) 通知，3秒后自动消失，玩家也可以点击关闭。

---

## 七、得分与评价系统

得分计算逻辑在 [scoreCalculator.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/scoreCalculator.ts)。

### 7.1 四维评分指标

| 指标 | 权重 | 计算方式 |
|------|------|---------|
| **清理完成率** (cleanRate) | 30% | 加权计算：关键工位权重×2，普通工位权重×1；关键工位≥90%/普通≥80%得满分 |
| **补料准确率** (refillAccuracy) | 25% | (补料任务完成率 + 物料充足工位占比) / 2 |
| **延误时长** (delayDuration) | 25% | 延误越久扣分越多；提前结束加分 |
| **工位利用率** (stationUtilization) | 20% | 有任务完成的工位占比，关键工位权重×2 |

### 7.2 总分计算
```
总分 = cleanRate×0.3 + refillAccuracy×0.25 + (100 - delayScore)×0.25 + stationUtilization×0.2
```

### 7.3 星级评定
- ≥ 90分 → ★★★ (3星)
- ≥ 70分 → ★★ (2星)
- ≥ 50分 → ★ (1星)
- < 50分 → 无星

### 7.4 关卡解锁
当前关卡得分 ≥ `level.unlockScore` 时，自动解锁下一关：
- 关卡1（新手入门）：60分解锁关卡2
- 关卡2（材料危机）：70分解锁关卡3
- 关卡3（清洁挑战）：75分解锁关卡4
- 关卡4（双重压力）：80分（最终关）

---

## 八、数据持久化与历史记录

### 8.1 localStorage 存储
存储在 [storage.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts)，键名为 `station-scheduler-save`。

保存的数据结构 `LocalSaveData`：
```typescript
{
  unlockedLevels: number[];      // 已解锁关卡ID列表，默认[1]
  bestScores: Record<number, Score>;  // 每个关卡的最高分
  scoreHistory: Score[];         // 历史成绩记录（最多保留50条）
  replayData: ReplayData[];      // 复盘数据（最多保留50条）
}
```

### 8.2 分数保存逻辑
每次游戏结束调用 `saveScore()`：
1. 如果是该关卡最高分，更新 bestScores
2. 将新分数插入 scoreHistory 队首，截取前50条
3. 检查是否达到解锁分数，解锁下一关
4. 保存到 localStorage

### 8.3 复盘数据
每次游戏结束构建 `ReplayData` 并保存：
- `events[]`: 所有已触发事件及其触发时间点
- `tasks[]`: 所有任务的启动时间、完成时间、是否被删除
- `finalStations[]`: 游戏结束时各工位的最终状态
- `scoreBreakdown`: 分数详情

复盘页面 [ReplayPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ReplayPage.tsx) 展示：
1. 总分概览与历史最佳对比
2. 事件触发时间线
3. 任务完成顺序（含未完成、已删除）
4. 工位最终状态
5. 分数构成详情

---

## 九、用户操作路径

### 9.1 新玩家流程
```
1. 主菜单 → 游戏教程（可选）
2. 主菜单 → 开始游戏 → 关卡选择
3. 点击"新手入门"(关卡1)开始游戏
4. 游戏界面：
   - 查看工位状态（左侧）
   - 查看任务列表（右侧）
   - 拖拽调整任务顺序
   - 点击"触发补料"添加补料任务
   - 点击"开始下一场"提前结束
5. 结算页面查看分数和星级
6. 返回关卡选择或继续下一关
```

### 9.2 游戏中界面布局
[GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx#L40-L71) 采用三栏布局：
```
┌─────────────────────────────────────────────────────────┐
│  关卡信息 + 进度条 (TimerBar)                            │
├──────────────┬──────────────────────────────────────────┤
│              │  任务清单 (TaskList)                      │
│  工位状态    │  - 进行中任务                              │
│  (StationPanel)│  - 待执行任务（可拖拽、调优先级、删除）  │
│              │  - 已完成任务                              │
│              ├──────────────────────────────────────────┤
│              │  控制面板 (ControlPanel)                   │
│              │  - 暂停/继续/开始下一场/返回菜单           │
└──────────────┴──────────────────────────────────────────┘
```

---

## 十、项目目录结构

```
src/
├── components/          # UI组件
│   ├── ControlPanel.tsx    # 控制面板（暂停/继续/下一场）
│   ├── EventNotification.tsx # 事件弹窗通知
│   ├── StationPanel.tsx    # 工位状态面板
│   ├── TaskList.tsx        # 任务列表（含拖拽排序）
│   └── TimerBar.tsx        # 倒计时进度条
├── data/
│   └── levels.ts          # 关卡配置数据
├── hooks/
│   └── useTheme.ts        # 主题hook（未使用）
├── pages/                # 页面组件
│   ├── MainMenu.tsx       # 主菜单
│   ├── LevelSelect.tsx    # 关卡选择
│   ├── GamePage.tsx       # 游戏主界面
│   ├── ResultPage.tsx     # 结算页
│   ├── TutorialPage.tsx   # 教程页
│   ├── ScoresPage.tsx     # 成绩记录页
│   └── ReplayPage.tsx     # 复盘页
├── store/
│   └── gameStore.ts       # Zustand全局状态 + 所有游戏逻辑
├── types/
│   └── index.ts           # TypeScript类型定义
├── utils/
│   ├── scoreCalculator.ts # 得分计算
│   └── storage.ts         # localStorage持久化
├── App.tsx               # 根组件（页面路由）
└── main.tsx              # 入口
```

---

## 十一、后续扩展点与优化建议

### 11.1 潜在 Bug / 逻辑问题

1. **priority 字段无效**：当前任务的 `priority`（high/medium/low）只影响UI颜色，不影响实际调度顺序。调度顺序完全由 tasks 数组顺序决定。需要决定：要么移除 priority 字段，要么让排序时自动按优先级排列。

2. **任务排序逻辑问题**：[TaskList.tsx L140-144](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TaskList.tsx#L140-L144) 拖拽排序用的索引是 pendingTasks 内的相对索引，但 `reorderTasks` 接收的是 tasks 全数组的索引，通过 `pendingStartIndex` 做偏移。这个逻辑在 pendingTasks 前面有 inProgress/completed 任务时可能会计算错误。

3. **事件索引问题**：[finishGame()](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L350-L363) 构建 replayEvents 时，用 `state.activeEvents.indexOf(e)` 获取索引，但数组在 map 过程中可能有引用问题。

### 11.2 功能扩展方向

1. **更多关卡和事件类型**：当前只有4关，可扩展更多事件如：设备故障（任务暂停）、临时加急任务、多人协作等。

2. **任务优先级真正生效**：让高优先级任务自动排到前面，或按优先级加权调度。

3. **工位类型多样化**：不同工位有不同的清理/补料耗时，不同的关键程度。

4. **音效和动画**：任务完成、事件触发时增加反馈。

5. **玩家操作撤销**：删除任务后可撤销。

6. **游戏难度曲线**：关卡时长递减（90→80→70→60），工位数递增（3→4→5→5），事件数递增。

7. **成就系统**：基于 scoreHistory 统计，如"连续3局3星"、"0延误通关"等。

### 11.3 代码架构优化点

1. **将游戏逻辑从 Store 拆分**：`gameStore.ts` 有400+行，包含了tick调度、分数计算、复盘数据构建等多种职责，可拆分为独立的模块。

2. **使用 useReducer 或拆分 selector**：避免组件因不相关状态变化而重渲染。

3. **补全 useTheme 等未使用的 hook**：或删除无用代码。

4. **增加测试**：得分计算、任务调度等核心逻辑适合单元测试。

---

## 十二、核心文件速查

| 功能 | 文件位置 |
|------|---------|
| 全局状态 + 游戏循环逻辑 | [gameStore.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts) |
| 类型定义 | [types/index.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/types/index.ts) |
| 关卡配置数据 | [data/levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts) |
| 得分计算算法 | [utils/scoreCalculator.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/scoreCalculator.ts) |
| 数据持久化 | [utils/storage.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts) |
| 游戏主界面 | [pages/GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx) |
| 任务列表+拖拽 | [components/TaskList.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TaskList.tsx) |
| 复盘页 | [pages/ReplayPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ReplayPage.tsx) |
