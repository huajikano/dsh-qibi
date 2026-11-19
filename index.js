/**
 * 稳定入口：只声明 inject 与激活钩子，实现放在 lib/host.js。
 *
 * 为什么多这一层：DSH 的 Loader 按 URL 缓存 ESM 模块，直接写 `apply` 的话，
 * 改完 Host 代码必须重启整个 DSH 才会生效。这里用带修订号的动态导入，
 * 于是「在插件页把这一行关掉再打开」就能重新加载磁盘上的最新实现。
 * 查询串只影响模块缓存，不改变语义。
 */

/** 插件名。 */
export const name = 'qibi'

/**
 * 依赖的宿主服务。
 *
 * 注意这里**没有** `webServer`：数据通道用的是 `ctx.connection.fetch.register()`
 * 注册在共享 `/api` 通道上的精确路由，由 Connection 自己持有物理载体。
 * （对照：`ctx.connection.rpc.handle()` 会用 connection 插件自己的 context 去摸 `webServer`，
 * 在该 context 未注入 webServer 的宿主上必定抛 `cannot get property "webServer" without inject`。）
 */
export const inject = ['connection', 'tools', 'systemPrompt']

/**
 * 激活插件。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文。
 * @param {Record<string, unknown>} [config] 插件 config（allowWrite / dataDir / userId）。
 */
export async function apply(ctx, config) {
  const rev = Date.now().toString(36)
  const host = await import(`./lib/host.js?rev=${rev}`)
  await host.activate(ctx, config ?? {})
}
