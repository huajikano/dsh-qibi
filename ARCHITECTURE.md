# 架构

`dsh-qibi` 是 DSH 插件，不是起笔桌面程序的移植。它直接读写起笔格式的本地 SQLite 库，并通过 DSH 原生的侧栏面板与工具把能力暴露给作者和 Agent。

```
浏览器（DSH 面板）
  src/*.jsx ──build.mjs──▶ client.js（提交入库，宿主加载）
        │  fetch('api/qibi')  +  /api/qibi/ai（SSE）
        ▼
Host（Node，lib/）
  index.js → lib/host.js（activate）
        ├── lib/store.js          数据层：归属、令牌、事务、索引
        ├── lib/database.js       仅在文件不存在时初始化空库
        ├── lib/tools.js          13 个 qibi_* 工具
        ├── lib/ai.js             DSH ctx.llm 的提示与流式封装
        ├── lib/character-ai.js   人物候选（只读预览）
        ├── lib/continuity-ai.js  单章连续性草稿
        └── lib/continuity-organizer.js  整理任务：串行、超时、去重
        ▼
本地 novelforge.db（WAL）
```

## 边界

- **数据只在本机**。插件不访问网络模型以外的服务；模型调用走宿主 `ctx.llm`。
- **不搬移旧库**。`ensureEmptyDatabase` 只对不存在的文件建库；已存在文件只做只读结构校验，不迁移、不加列。
- **不改宿主全局**。面板样式限定在 `.qibi-theme-scope` 内，主题与密度只影响起笔。

## 写入不变量

正文覆盖（`saveChapter`）与删除、恢复等操作遵循同一组规则：

1. `expectedToken`（`updated_at + 正文哈希`）在事务内比对，不匹配即拒绝。
2. 覆盖前写入 `chapter_revisions`；删除前另存 `dataDir/chapter-backups/*.json`。
3. 更新 `word_count` 与作品总字数，重建该章 `kb_chunks`。
4. 空内容覆盖与“截断成前缀”的写回默认拒绝，需显式 `allowEmpty` / `allowTruncate`。

资料类实体（大纲、人物、分卷、摘要、写作状态）使用字段级令牌；`expectedAbsent` 用于“载入时这一行还不存在”的场景，防止旧空表单覆盖新数据。

## 面板与 Host 的契约

- `POST /api/qibi`：`{ endpoint, payload }` → `{ ok, value }` 或 `{ ok: false, error: { code, message, details } }`。
- `POST /api/qibi/ai`：SSE；`delta` 增量、`done` 收尾（可能带 `truncated`）、`error` 失败。
- 客户端 `callHost` 把 `error.code` 保留在 `Error.code` 上，UI 据此分支（如 `ENTITY_CONFLICT`）。
- `status` 额外回报 `pluginVersion` 与 `hostStartedAt`，页脚据此提示“界面与后台版本不一致”。

## 前端状态

- 单一 `Workbench` 组件持有作品/章节/草稿；主题与密度在外层 `AppearanceFrame`，切换不重挂载编辑器。
- 保存串行化：`src/draft-save.js` 保证同一时刻只有一个保存请求，并在换章前排空最新草稿。
- 面板数据一律来自 Host，不在浏览器里推断（例如章节列表不缓存正文）。

## 构建与发布

- `build.mjs` 用 esbuild 打出 CJS，再包进 `window.__ModuleLoader__.load({ id, factory })`；React 由宿主提供。
- `src/build-info.js` 由构建写入（版本 + 源码哈希），页脚显示；`npm run check:build` 校验提交产物与源码一致。
- 发布包由 `npm pack` 的 `files` 白名单生成，只含运行时、预构建 `client.js`、文档与图标；不含 `src/`、`scripts/` 或任何数据。

## 为什么这样分层

- 宿主 API 会变：把 `ctx`、`llm`、`connection` 的接触面集中在 `lib/host.js`，其余模块只依赖普通 Node。
- 面板与 Agent 必须看到同一份正典：业务规则只在 `store.js` 实现一次，UI 与工具都是薄适配层。
- 出错要可诊断：稳定错误码 + 版本指纹 + 明确的“下一步”文案，比堆日志有用。
