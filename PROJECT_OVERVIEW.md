# 工位调度大师（Station Scheduler Game）项目业务理解文档

> 一个基于 React + TypeScript + Zustand + Tailwind 的纯前端调度小游戏。玩家在限定时间内合理安排工位的「清洁」与「补料」两类任务，应对各种突发事件，最终获得带星级的综合评分，并支持多关卡解锁、历史记录与回放复盘。

---

## 一、技术栈与运行结构

- **构建工具**：Vite 6 + TypeScript 5.8（`tsconfig.json` 配置 `@/*` 路径别名指向 `src/*`）
- **UI 框架**：React 18 + TailwindCSS 3
- **状态管理**：Zustand（单 store，集中管理游戏全部运行时状态）
- **路由**：未使用 React Router，而是通过 `gameStore.currentPage` 字段做「枚举式手动路由」，由 [App.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/App.tsx) 中的 `switch` 渲染对应页面
- **持久化**：`localStorage`（key=`station-scheduler-save`），由 [storage.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts) 统一封装
- **第三方依赖**：`lucide-react`（图标，目前几乎未使用，多以 emoji 替代）、`clsx` / `tailwind-merge`（样式合并工具）、`react-router-dom`（已安装但未启用）

可用脚本：`npm run dev` / `build` / `lint` / `check`。

---

## 二、整体页面流程

页面切换完全靠 `gameStore.navigateTo(page)`，可选页面为 `PageType = 'menu' | 'levelSelect' | 'game' | 'result' | 'tutorial' | 'scores' | 'replay'`。

```text
        ┌────────────┐
        │  MainMenu  │  → 开始游戏 / 教程 / 成绩记录
        └─────┬──────┘
              │
   ┌──────────┼──────────────────────┐
   ▼          ▼                      ▼
TutorialPage  LevelSelect         ScoresPage
              │  （仅 unlocked  ）   │
              ▼                      │
           GamePage  ◀───────────────┘  ← 历史记录可点击查看回放
              │  tick() 每 1s 推进
              ▼
           ResultPage  → 重新挑战 / 下一关 / 查看复盘 / 返回菜单
              │
              ▼
           ReplayPage  → 返回上一来源页（结算页或成绩页）
```

关键文件：
- [MainMenu.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/MainMenu.tsx)：三个入口按钮
- [LevelSelect.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/LevelSelect.tsx)：根据 `unlockedLevels` 渲染锁/解锁卡片，点击 → `startLevel(id)`
- [GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx)：核心游戏页，组合 `TimerBar` / `StationPanel` / `TaskList` / `ControlPanel` / `EventNotification`
- [ResultPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ResultPage.tsx)：四维评分展示 + 下一关解锁提示
- [ReplayPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ReplayPage.tsx)：基于本地存档回放一局
- [ScoresPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ScoresPage.tsx)：关卡进度 + 历史记录 + 重置存档
- [Home.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/Home.tsx)：空占位组件，未被使用，可清理或作为后续扩展入口

---

## 三、核心数据结构（[`src/types/index.ts`](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/types/index.ts)）

### 1. 关卡 `Level`
```ts
{
  id, name, description,
  duration: number,        // 秒
  stationCount: number,    // 工位数量
  events: GameEvent[],     // 关卡内预设事件
  unlockScore: number,     // 通过当前关解锁下一关所需的分数
}
```
所有关卡数据写死在 [levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts) 中，目前 4 关，依次为：新手入门 / 材料危机 / 清洁挑战 / 双重压力。

### 2. 工位 `Station`
```ts
{
  id, name,
  cleanliness: number,            // 0~100
  materialStatus: 'full' | 'partial' | 'empty' | 'missing',
  isCritical: boolean,            // 1 号工位标记为关键工位（评分加权）
  isDirty: boolean,               // 重度污损标记，会让清洁时间 ×2
  currentTaskId: string | null,   // 已声明但未实际使用，可清理
}
```
初始化函数 `getInitialStations(count)` 中 `cleanliness` 是 20–60 的随机值，`materialStatus` 从 `partial/empty/partial` 随机选取（→ `full` 永远不会作为初始值，所以每个工位开局都会生成补料任务）。

### 3. 任务 `Task`
```ts
{
  id, type: 'clean' | 'refill',
  stationId,
  priority: 'high' | 'medium' | 'low',
  duration: number,    // 秒
  progress: number,    // 0~100
  status: 'pending' | 'in_progress' | 'completed',
}
```

### 4. 事件 `GameEvent`
四种类型：`missing_material` / `severe_dirt` / `guide_delay` / `early_arrival`，每个事件都带有触发时间 `time`（秒，从开局起算）。

### 5. 得分 `Score` 与回放 `ReplayData`
- `Score` 含 4 维分数 + 总分 + 星级 + `levelId` + `timestamp`
- `ReplayData` 详尽记录一局的「事件触发时间线、任务起止时间、删除任务、最终工位状态、得分构成」，用于复盘页

### 6. 全局 `GameState`
除了上述实体外，还包含：
- `taskTimeline / eventTimeline / removedTaskSnapshots`：用于结算时构造回放数据
- `guideDelayTime / earlyArrivalTime`：突发事件对剩余时间的修正
- `dismissedEventIndices`：已关闭通知的事件索引（避免重复弹出）
- `currentReplayTimestamp / replayReturnPage`：回放页的上下文

---

## 四、核心业务逻辑：`gameStore`（[gameStore.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts)）

整个游戏的「驱动器」就是这一个 store，逻辑高度集中。

### 1. 关卡启动 `startLevel(levelId)`
1. 由 `getInitialStations(count)` 生成工位（带随机的清洁度和材料状态）
2. 遍历每个工位，按规则**自动**生成初始任务：
   - `cleanliness < 80` → 生成 `clean` 任务，`isCritical` 工位优先级 `high`
   - `materialStatus !== 'full'` → 生成 `refill` 任务，`empty` 状态优先级 `high`
3. 重置所有运行时字段（计时器/事件/timeline 等）

### 2. 时钟循环 `tick()`（每 1 秒由 `GamePage` 的 `setInterval` 调用）
按以下顺序执行：

1. **结束判定**：`actualTimeRemaining = timeRemaining - earlyArrivalTime + guideDelayTime`，若 ≤0 则调用 `finishGame()`。
2. **事件触发**：当 `level.duration - timeRemaining >= event.time` 时触发事件，执行对应副作用：
   - `severe_dirt`：将工位标记 `isDirty=true`，并把该工位上未完成的清洁任务 `duration ×2`
   - `missing_material`：将工位 `materialStatus` 改为 `missing`
   - `guide_delay`：`guideDelayTime = 10`（额外赠送 10s）
   - `early_arrival`：`earlyArrivalTime = 15`（提前 15s 结束）
   - 同时把 `(eventIndex, elapsed)` 写入 `eventTimeline`
3. **任务调度**（**最多并行 2 个任务**，且同一工位不可并行）：
   - 从 `pending` 队列里挑出与当前进行中工位不冲突的任务，把状态置为 `in_progress`，并写入 `taskTimeline`
   - 当前实现会按 `tasks` 数组里的**自然顺序**取，因此 `TaskList` 的拖拽顺序直接决定执行顺序，但**优先级 `priority` 字段并不会影响调度**（仅作为 UI 标签，是潜在优化点）
4. **任务推进**：每个 `in_progress` 任务按 `100 / duration` 增量推进：
   - 完成时把工位 `cleanliness` 直接置为 100 / `materialStatus` 置为 `full`
   - 写入 `taskTimeline`（type=`completed`），状态改为 `completed`
5. `timeRemaining -= 1`

### 3. 任务管理 API
- `addTask(stationId, type)`：手动新增（同站同类任务去重）
- `removeTask(taskId)`：删除任务并写入 `removedTaskSnapshots`，用于回放页区分「主动删除」
- `reorderTasks(start, end)`：拖拽排序（`TaskList` 中实现 HTML5 原生拖拽）
- `changeTaskPriority(id, priority)`：仅修改字段，不影响调度顺序
- `triggerRefill(stationId)`：`StationPanel` 上的快捷按钮，等价于 `addTask(stationId, 'refill')`

### 4. 流程控制
- `pauseGame / resumeGame`：通过 `gameStatus` 控制 `tick` 是否执行
- `startNextSession()`：玩家主动结束（"开始下一场"），会标记 `isNextSessionReady=true` 并调用 `finishGame`，这会影响延误分的计算公式
- `dismissEvent(index)`：关闭事件通知

### 5. 结算 `finishGame()`
1. 计算 `delayDuration`：
   - **若主动开始下一场**：`max(0, elapsedTime - level.duration)`（理论上 ≤0，因为是提前结束）
   - **否则**：`max(0, level.duration - timeRemaining + 10)`，相当于一个保底惩罚（注意：当倒计时归零时 `timeRemaining=0`，此时 `delayDuration = level.duration + 10`，这是当前公式的一个**潜在 bug 点**，详见第七节）
2. 调用 `calculateScore` 得到四维分 + 星级
3. 通过 `saveScore` 写入 `bestScores / scoreHistory / unlockedLevels`
4. 拼装 `ReplayData`（任务起止/删除/事件时间线/最终工位状态/得分构成）→ `saveReplayData`
5. 跳转到 `result` 页

---

## 五、评分与解锁规则（[scoreCalculator.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/scoreCalculator.ts)）

总分 = 加权和（四舍五入）：

| 维度 | 权重 | 说明 |
| --- | --- | --- |
| `cleanRate`（清理完成率） | 0.30 | 关键工位权重 ×2、阈值 90，普通工位阈值 80 |
| `refillAccuracy`（补料准确率） | 0.25 | `(已完成补料任务比例 + 工位 full 比例) / 2` |
| `100 - delayScore`（守时） | 0.25 | 主动结束：`delay × 3`；自然结束：`min(100, delay × 2)` |
| `stationUtilization`（工位利用率） | 0.20 | 完成任务覆盖的工位（关键 ×2 加权） |

星级：≥90 三星 / ≥70 二星 / ≥50 一星 / 否则 0 星。

**解锁规则**（[storage.ts saveScore](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts#L45-L65)）：本局总分 ≥ `level.unlockScore` → 解锁下一关并写入 `unlockedLevels`。

---

## 六、用户操作路径速览

1. **进入游戏** MainMenu → LevelSelect → 点击未锁关卡 → `startLevel`
2. **游戏进行中**：
   - 顶部 [TimerBar](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TimerBar.tsx) 实时倒计时（受 guideDelay/earlyArrival 修正）
   - 左侧 [StationPanel](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/StationPanel.tsx)：点击「补料」按钮 → `triggerRefill`
   - 右上 [TaskList](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TaskList.tsx)：拖拽（仅 pending）/ 改优先级 / 删除任务
   - 右下 [ControlPanel](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/ControlPanel.tsx)：暂停 / 提前开始下一场 / 返回菜单
   - 右上角 [EventNotification](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/EventNotification.tsx)：突发事件 toast（3s 自动关闭）
3. **结算**：ResultPage 显示四维分数和星级，可重玩 / 看复盘 / 进下一关
4. **历史与复盘**：ScoresPage 列表 → 点击带回放图标的记录 → ReplayPage 还原本局事件、任务和最终工位状态

---

## 七、关键风险点与可优化点（为后续修复 / 扩展铺路）

### 数值与逻辑层
1. **`finishGame` 的 `delayDuration` 公式**：自然结束（倒计时跑完）时会得到 `level.duration + 10`，再 ×2 后非常容易直接打到 100 分上限的「负面分」，导致总分被严重拉低。建议改为「玩家被动延迟的实际秒数」。
2. **优先级 `priority` 不参与调度**：`tick` 只按数组顺序选 pending 任务。若想让 `high/medium/low` 真正生效，应在 `tick` 第 3 步排序后再切片。
3. **任务并行上限硬编码 `maxParallelTasks = 2`**：建议提到关卡或全局配置中，方便做难度梯度。
4. **`initialStations` 使用 `Math.random`**：每次开局工位状态都不同，这会让回放/最佳分的可比性下降；可考虑按 `levelId` 做种子化随机或固定预设。
5. **`startNextSession` 后立刻 `finishGame`**：当前实现忽略了「下一场到达 → 真实计时差」的概念，时间维度比较粗糙。

### 数据与回放层
6. **回放事件 index 复原方式**（`gameStore.finishGame` 中 `state.activeEvents.indexOf(e)`）：若同一关有重复事件可能匹配错位，建议在 `eventTimeline` 中存原始 `event.id` 或 hash。
7. **`localStorage` 容量**：`scoreHistory` 与 `replayData` 各上限 50，但单个 `ReplayData` 体积会随关卡时长线性增长，长期使用需要考虑压缩或下沉到 IndexedDB。
8. **存档结构没有版本号**：未来字段变更会直接丢数据，建议加 `version` 字段并做迁移。

### UI / 交互层
9. **`EventNotification` 的双重 dismiss 状态**（store 端 `dismissedEventIndices` + 组件 `localDismissed`）逻辑有些冗余，可以收敛到一处。
10. **`Station.currentTaskId` 字段未使用**：要么接入 UI（高亮当前正在处理的工位），要么清理。
11. **`Home.tsx` 是空组件**、`react-router-dom` 已安装未用：可决策是「升级到真路由」还是清理掉。
12. **国际化**：所有 UI 文案与事件描述都硬编码中文，需要 i18n 时改造点很多。

### 工程化
13. **没有任何测试**：核心是 `gameStore.tick` 与 `scoreCalculator`，纯函数 + 可测，建议优先补单测。
14. **`useTheme` hook 似乎未被任何页面使用**，可清理。
15. **eslint 没接 type-aware 规则、`tsc` 未在 CI 中执行**：`npm run check` 已经写好，可以纳入 CI。

---

## 八、后续可扩展方向

- **关卡编辑器 / 关卡 JSON 化**：把 [levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts) 的硬编码改为外部 JSON / 后端拉取
- **更多事件类型**：如「设备故障（工位临时不可用）」「VIP 客户（特定工位强制 high）」，扩展 `EventType` + 在 `tick` 加 case 即可
- **任务子类型**：当前只有 `clean` / `refill`，可扩展为 `inspect / restock / guide`
- **联机 / 排行榜**：把 `saveScore` 后的数据上报到后端
- **回放可视化播放**：现在 `ReplayPage` 是「静态时间线」，可以加一个「按时间轴播放」按钮，重现 stations 状态变化
- **音效与动画**：目前完全无音效，事件触发可加提示音；任务完成可加 confetti
- **难度系数 / 多人 / 成就系统**：均可在 `gameStore` 与 `Score` 上扩展

---

## 九、关键代码导航速查表

| 关注点 | 入口位置 |
| --- | --- |
| 路由切换 | [App.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/App.tsx#L13-L32) |
| 关卡数据 | [levels.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/data/levels.ts) |
| 全局状态 / 业务逻辑 | [gameStore.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts) |
| tick 循环（事件 + 调度 + 进度） | [gameStore.ts#L109-L218](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L109-L218) |
| 结算 + 回放数据组装 | [gameStore.ts#L289-L395](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/store/gameStore.ts#L289-L395) |
| 评分公式 | [scoreCalculator.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/scoreCalculator.ts) |
| 本地存档读写 | [storage.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/utils/storage.ts) |
| 类型定义 | [types/index.ts](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/types/index.ts) |
| 游戏主页面 | [GamePage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/GamePage.tsx) |
| 任务交互 | [TaskList.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/TaskList.tsx) |
| 工位与补料 | [StationPanel.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/StationPanel.tsx) |
| 事件通知 | [EventNotification.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/components/EventNotification.tsx) |
| 复盘页 | [ReplayPage.tsx](file:///Users/zhangxinyu/sunxidan/9999-gsb/0618/station-game/src/pages/ReplayPage.tsx) |

---

> 总结一句话：项目把「关卡数据 + 工位状态 + 任务队列 + 突发事件 + 计时器」全部塞进一个 Zustand store，由 `tick()` 每秒驱动事件、调度、推进；结算时聚合为四维评分并落地为可回放的本地存档。后续优化的最大空间在「让优先级真正参与调度」「修复 `delayDuration` 公式」「关卡数据外置」「补单测」这几个方向。
