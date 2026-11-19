<div align="center">

<img src="assets/icon-180.png" width="120" alt="dsh-qibi" />

# dsh-qibi

**起笔写作台 · DeepSeek Harness 原生小说工作台**

把本机的起笔（QiBi）书稿接进 DSH：左侧栏一个面板、11 个工具、13 种 AI 写作动作。

<p>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f766e?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/DSH-0.2.x-1d4ed8?style=for-the-badge" alt="Compatible DSH" />
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A522.19-3f7d3a?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/topic-dsh--plugin-d97706?style=for-the-badge&logo=github" alt="dsh-plugin" />
</p>

<p>
  <a href="#快速安装">⚡ 快速安装</a> ·
  <a href="#工作台一览">🎨 工作台一览</a> ·
  <a href="#三步开始">🚀 开始使用</a> ·
  <a href="#核心能力">✨ 核心能力</a> ·
  <a href="#工具参考">🧰 工具参考</a> ·
  <a href="#数据与安全边界">🔒 数据与安全</a> ·
  <a href="#排错">🛠️ 排错</a> ·
  <a href="#language--english-guide">🌐 English</a>
</p>

</div>

> **本地优先。** 插件只读本机那一个 SQLite 文件，所有作品、正文与设定都留在你自己的磁盘上；插件本身不含任何示例小说内容。
>
> *Native QiBi writing desk for DeepSeek Harness: sidebar panel, 11 model tools, and 13 AI writing actions over your local `novelforge.db`.*

---

## 目录

| 开始使用 | 创作与能力 | 维护与文档 |
| :--- | :--- | :--- |
| [工作台一览](#工作台一览)<br />[快速安装](#快速安装)<br />[三步开始](#三步开始) | [核心能力](#核心能力)<br />[工具参考](#工具参考)<br />[AI 写作动作](#ai-写作动作) | [配置](#配置)<br />[数据与安全边界](#数据与安全边界)<br />[排错](#排错)<br />[开发](#开发) |

---

## 工作台一览

DSH 左侧栏出现一枚「起笔」图标，点开是 DSH 原生面板（不是 iframe）。左侧作品 → 章节树，右侧七个页签：

| 页签 | 做什么 |
| :--- | :--- |
| **正文** | 编辑当前章，停止输入后自动保存；本章出场人物可一键插入光标处；细纲锚点按标题前 8 字在正文定位，已写到的直接跳转；`Alt+F` 专注模式；`Ctrl+Z` / `Ctrl+Y` 撤销重做（含 AI 写入等程序化改动） |
| **大纲** | 总纲与章节细纲的查看、新建、修改、删除（字段级乐观锁） |
| **人物** | 人物设定卡与动态账本（位置 / 境界 / 道具 / 状态 / 近期事件 / 关键关系） |
| **连续性** | 分卷、章节微摘要（关键事件 / 章末钩子）、作品写作状态与伏笔账本 |
| **检索** | 关键词检索 + 起笔自带 BM25 知识库检索，可整本重建索引 |
| **版本** | 章节历史版本列表与恢复（恢复前先把当前正文备份） |
| **导出** | 整本导出 Markdown / TXT 文本 |

保存状态在标题栏直接可见：`保存中… / 已保存 / 未保存 / 冲突`。**冲突**时不会静默覆盖，而是给出「重载起笔版本」与「强制覆盖（先备份）」两个出口。

<!-- 截图待补：面板需要以本机真实书稿取景，未随初始仓库提交，避免把作者正文带入公开仓库。 -->

---

## 快速安装

> **运行要求**：DSH `0.2.x`（已验证 `0.2.2-rc.3`）· Node.js ≥ 22.19 · 本机装有起笔桌面版（数据目录里有 `novelforge.db`）

```sh
dsh plugin --profile web add -w dsh-qibi
dsh web
```

尚未发布到 npm 时，从 GitHub 安装：

```sh
dsh plugin --profile web add -w github:huajikano/dsh-qibi
```

或在 **设置 → 插件 → 添加插件 → 本地目录**，选择本仓库根目录（含 `package.json` 的那一层）。

装好后**重启 DSH**，左侧栏出现「起笔」即为生效。

---

## 三步开始

1. **确认数据目录能被找到**。默认是起笔桌面版的数据目录 `%APPDATA%\desktop\data`（macOS 为 `~/Library/Application Support/desktop/data`）。如果起笔被你改到别处，在配置里写 `dataDir`。
2. **点开左侧栏「起笔」**。面板会列出当前作者的全部作品；选中一章即可读写。
3. **让 Agent 参与**。直接说「写第五章」「把这一章润色一下」，或让 Agent 调用 `qibi_chapter`、`qibi_distill`；面板会自己发现磁盘上的变化。

选中章节会同步给宿主：Agent 的系统提示里多一行「作者当前在 DSH 面板里选中了作品《X》·第 N 章」，于是「这一章」不需要再问是哪一章。

---

## 核心能力

| 模块 | 说明 |
| :--- | :--- |
| **书稿读写** | 作品 / 章节 / 大纲 / 人物 / 分卷 / 摘要 / 写作状态的增删改查；章节可上移下移 |
| **版本历史** | 每次覆盖正文前自动写入起笔的 `chapter_revisions`（沿用其「最近 50 版」策略）；删除章节前另存正文到 `dataDir/chapter-backups/` |
| **并发保护** | 保存带 `updated_at + 正文哈希` 的令牌，校验与写入在同一个 `BEGIN IMMEDIATE` 事务内完成；大纲/人物/分卷/摘要/写作状态亦有字段级令牌 |
| **写入护栏** | 已有正文必须带令牌才能写；空内容覆盖、疑似「截断成前缀」的写回默认拒绝；读取被截断时不发放令牌 |
| **检索** | 与起笔同源的 BM25（`kb_chunks`、同一套分词与打分），写入时同步重建该章分块 |
| **蒸馏作者** | 上传 TXT / MD / HTML / JSON / EPUB 样章解析成素材；把 Agent 产出的三段结果存为版本，可回滚、可绑定到作品；绑定后生成时遵循该版本的写作 Skill |
| **导出** | 整本 Markdown / TXT，返回文本与建议文件名（落盘交给 DSH 的文件工具） |
| **不重复造轮子** | 插件不内置模型调用层：AI 走 DSH 自己的 `ctx.llm`，用你当前默认模型，因此不需要在插件里另配 Key |

---

## 工具参考

11 个领域工具，每个用 `action` 区分动作。省略 `novelId` / `chapterId` 时默认取面板当前选中项。

| 工具 | 动作 | 说明 |
| :--- | :--- | :--- |
| `qibi_status` | — | 数据目录、当前作者、作品/章节/字数统计、写入是否开启、面板选中项 |
| `qibi_novel` | `list` `get` `create` `update` `delete` | 作品增删改查；删除需 `confirm: true` |
| `qibi_chapter` | `list` `read` `write` `create` `update` `delete` `move` | 章节读写与增删；`write` 返回 `token` 供下次带令牌覆盖 |
| `qibi_revision` | `list` `restore` | 章节版本历史与恢复 |
| `qibi_outline` | `list` `create` `update` `delete` | 总纲与章节细纲 |
| `qibi_character` | `list` `create` `update` `delete` `state` `set_state` | 人物设定与动态账本 |
| `qibi_continuity` | `volumes` `create_volume` `update_volume` `summary` `set_summary` `writer_state` `set_writer_state` | 分卷、章节摘要、写作状态与伏笔账本 |
| `qibi_kb` | `query` `stats` `reindex` | 起笔自带 BM25 检索与索引维护 |
| `qibi_search` | — | 章节标题/正文 + 人物关键词检索 |
| `qibi_export` | — | 整本 Markdown / TXT |
| `qibi_distill` | `authors` `author` `read` `save` `bind` `unbind` `versions` `rollback` `create` `add_text` | 蒸馏作者的素材、版本与绑定 |

写章节的推荐顺序：**先 `qibi_chapter(action=read)` 拿 `token`，再带 `expectedToken` 写入**。这样作者同时在起笔里改稿时不会被覆盖。

---

## AI 写作动作

面板内的 13 个动作全部通过 DSH 的 `ctx.llm` 发起，使用你当前的默认模型：

- **选区（3）**：去 AI 味、润色、扩写——只替换选中文本。
- **整章（5）**：起草、续写、润色、去 AI 味、扩写。
- **分析（5）**：审稿、拆解、章节摘要、细纲、创作顾问。

配套约定：输出未完整结束时只能复制、不能写回正文；达到模型长度上限时可点「继续生成」接着写完；写回正文后通知条可一键撤销；每次完整生成留在抽屉的「生成历史」里（本机保存），应用时另在起笔版本历史写一条 `AI 生成 · 模式名`。

上下文按「作品 → 章节目录/摘要 → 细纲 → 人物 → 分卷 → 进度/伏笔 → 蒸馏 Skill → 前文」组装，并全部做长度上限，避免把整本塞进一次请求。

---

## 配置

写在 DSH profile 的 `cordis.patch.yml`，覆盖 bundle 层的同一行：

```yaml
- id: qibi
  config:
    allowWrite: true                                          # 关掉即全局只读
    dataDir: 'C:\Users\你\AppData\Roaming\desktop\data'        # 默认即此路径，可省
    userId: 2                                                  # 多用户时才需要
```

| 键 | 默认 | 含义 |
| :--- | :--- | :--- |
| `allowWrite` | `true` | 硬开关。`false` 时面板与工具都拒绝一切写入，只保留读取 |
| `dataDir` | `%APPDATA%\desktop\data` | 起笔数据目录；也可用环境变量 `QIBI_DATA_DIR` |
| `userId` | 第一个有作品的未禁用用户 | 多用户起笔里固定作者 |

面板右上角的写入开关只能在 `allowWrite: true` 的前提下临时收窄，不能放宽。

---

## 数据与安全边界

- **唯一数据通路**是本机的 `novelforge.db`（WAL 模式）。插件与 `起笔.exe` 没有进程关系，**不需要起笔正在运行**；两边同时开着也安全（`busy_timeout` + 短事务）。
- **只动内容表**：`novels` / `chapters` / `outlines` / `characters` / `volumes` / `chapter_summaries` / `character_states` / `novel_writer_state` / `chapter_revisions` / `kb_chunks` / 蒸馏相关表。**绝不读取** `users.*_api_key_enc`（AES-GCM 密文，插件不需要密钥）。
- **不改库结构**：不建表、不加列、不跑 DDL；列名先按 `PRAGMA table_info` 探测，缺列就降级，宁可只读也不动你的库。
- **不覆盖手稿**：写前备份 + 令牌乐观锁（见[核心能力](#核心能力)）。
- **归属校验**：作品 / 章节 / 大纲 / 人物 / 分卷都按当前作者校验，换 `userId` 既看不到也写不了别人的作品。
- 插件不经手任何 API Key；AI 请求由 DSH 宿主发起。

---

## 与起笔应用的关系

这是一个**独立**的 DSH 插件，不是起笔的一部分，也不会被一起打包：

| | 起笔桌面版 | dsh-qibi |
| :--- | :--- | :--- |
| 形态 | Electron 便携 exe | DSH profile 里的一个包 |
| 界面 | 自己的完整前端 | DSH 原生面板（`sidebar.panellist` + `main`） |
| 关系 | — | 只通过磁盘上那一个 `novelforge.db` 与起笔相交 |

因此：卸载插件不影响起笔；删掉起笔只是让面板显示「没有找到起笔数据库」；起笔升级改了表结构时，插件按缺列降级而不会写坏数据。

---

## 已知限制

- 地图编辑器、管理员与公网隧道、起笔自带的模型调用层不在插件范围内（AI 由 DSH 承担）。
- 蒸馏作者在插件里**不调用模型**：面板负责素材与版本，生成由 Agent 通过 `qibi_distill` 完成。
- 分卷可新建与修改，但「章节归属哪个分卷」仍按起笔数据只读展示。
- 若在起笔里大批量重建 BM25 索引，请以起笔侧结果为准。

---

## 排错

| 现象 | 处理 |
| :--- | :--- |
| 左侧栏没有「起笔」图标 | 确认 DSH ≥ 0.2；**重启 DSH**；在「设置 → 插件」里确认 `qibi` 这一行是开启状态 |
| 面板显示「没有找到起笔数据库」 | 面板会打印它找的完整路径；核对后改 `dataDir`（或环境变量 `QIBI_DATA_DIR`） |
| 保存提示「已被改动」 | 起笔或另一个窗口改过这一章。选择「重载」或「强制覆盖（先备份）」 |
| 写入被拒绝 | 检查 `allowWrite` 与面板右上角写入开关；Agent 侧最常见原因是漏带 `expectedToken` |
| 面板取数 401/403 | 刷新页面重新登录宿主的浏览器会话 |
| 想看插件在做什么 | `qibi_status` 一次性给出数据目录、作者、统计与写入状态 |

---

## 开发

```sh
npm install
node build.mjs             # src/*.jsx → client.js（esbuild，React 保持 external 由宿主提供）
node scripts/selftest.mjs  # 不起 DSH，直接跑 Host 半边与控制台渲染检查
```

自检覆盖：路由与工具契约、11 个工具的动作、只读拒写、正文保存的四处不变量（字数 / 版本备份 / 作品总字数 / 知识库分块）、令牌乐观锁、版本恢复、人物动态账本、章节摘要、写作状态、知识库重建与 BM25 检索、导出文本，以及 client.js 的 slot 渲染。

写测试**只落临时副本**，并在结束时断言真实库没有任何改动。自检需要本机已有一份起笔数据库（只读取它）；`scripts/make-icon.py` 生成市场用位图（Pillow）。

改动生效方式：`src/` 改完 `node build.mjs` 后刷新页面；`lib/`、`index.js` 改完在插件页把 `qibi` 关掉再打开即可，不必重启 DSH。

---

## 文档

| 文档 | 内容 |
| :--- | :--- |
| [docs/DETAIL.md](docs/DETAIL.md) | 功能清单、数据通路、安全边界与已知限制的完整版 |
| [LICENSE](LICENSE) | MIT |

---

## License

[MIT](LICENSE) · 插件自绘图标同为 MIT；不含任何第三方小说文本或图标素材。

## Language / English Guide

The panel follows the host language; switch at **Settings → General → Language**. Your manuscripts, outlines and assets keep whatever language they already use.

dsh-qibi is a DeepSeek Harness plugin that reads and writes a local QiBi (起笔) desktop-app database (`novelforge.db`). It adds a native sidebar panel with seven tabs (prose, outline, characters, continuity, search, versions, export), 11 `qibi_*` model tools, and 13 AI writing actions routed through the harness's own `ctx.llm`. It never reads stored API keys, never runs DDL, takes a revision backup before every overwrite, and refuses to write without an optimistic-lock token. The QiBi desktop app does not need to be running; the only contract between the two is that one SQLite file.
