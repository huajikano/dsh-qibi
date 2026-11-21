# Contributing

感谢改进 `dsh-qibi`。这个仓库同时是 DSH 插件与 GitHub 发行物的来源，改动请保持“可构建、可回归、可解释”。

## 环境

- Node.js **24+**（`node:sqlite` 与 V8 语法要求）。
- `npm ci` 安装依赖；不需要 pnpm。
- 已核对的宿主版本见 `package.json` 的 `dsh.compatibility.dsh`。

## 常用命令

```sh
npm run build              # src/*.jsx → client.js，并生成 src/build-info.js
npm run check:build        # 校验提交的 client.js 与 src/ 是否逐字节一致（不写文件）
npm run test:release       # 全部回归；临时夹具 + 模型替身，不碰真实书稿
npm run test:release -- --filter continuity   # 只跑名字匹配的检查
npm run test:local         # 可选：对你本机已有起笔库做只读集成自检
```

`test:release` 由 `scripts/test.mjs` 驱动：它按清单顺序执行、汇总通过/失败，`--filter` 选子集，`--bail` 首个失败即停。新增检查时**同时**把它加进 `scripts/test.mjs` 的 `ORDER`，否则不会被发布流程执行。

## 改动的硬性约定

1. **先写失败用例**。仓库里的 `*-check.mjs` 都是“先用合成数据复现，再修”。
2. **不读真实书稿**。测试一律用 `os.tmpdir()` 下的 `mkdtemp` 合成库或纯内存夹具；`selftest.mjs` 属于本机集成自检，**不进入** `test:release`。
3. **写正文的路径必须成对**：令牌校验、写前 `chapter_revisions`、`word_count`/作品总字数、`kb_chunks` 重建，四者缺一不可，且都在同一个 `BEGIN IMMEDIATE` 事务内。
4. **UI 与工具共用同一个服务**。面板按钮和 `qibi_*` 工具不能各写一套逻辑；新增能力先落 `lib/store.js`，再分别接 API 与工具。
5. **改完 `src/` 必跑 `npm run build`**，并把 `client.js` 与 `src/build-info.js` 一起提交；CI 会用 `npm run check:build` 拦截过期产物。
6. **不手工编辑 `client.js`**；它是构建产物。
7. **面板样式只用 `--dsw-alias-*` 令牌**，不引第三方字体、图标或 UI 库；不覆盖宿主全局样式。

## 提交信息

- `feat:` 新能力，`fix:` 修复，`docs:` 文档，`chore:` 杂务，`release:` 版本发布。
- 发布提交同时更新 `package.json`、`package-lock.json`、`CHANGELOG.md` 与 README 的版本/安装地址，再由维护者打 tag。
- **GitHub Release 必须由维护者逐次明确授权**；不要新增自动发布 workflow，也不要靠推 tag 绕过。

## 新增一个工具的步骤

1. 在 `lib/store.js` 写业务方法（含归属、令牌与事务）。
2. 在 `lib/tools.js` 里 `tools.push({...})`：名称、描述、`parameters`、`output.render`、`execute`。
3. 若面板也要用，在 `lib/host.js` 的 `dispatch` 加端点，`src/panel.jsx` 只调 `call(...)`。
4. 在 `scripts/` 加一个离线检查，并登记到 `scripts/test.mjs`。
5. 更新 README 工具表与 `locale/*.json` 里的工具描述。

## 隐私

不要提交小说正文、数据库、`chapter-backups`、`.env`、凭据或本机绝对路径。发布包用 `npm pack` 的 `files` 白名单；改动白名单前请确认不会把测试或数据带进包内。

## 许可

提交即表示同意以 MIT 许可发布你的贡献。
