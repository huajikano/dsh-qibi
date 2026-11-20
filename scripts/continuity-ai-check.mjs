import assert from 'node:assert/strict'
import { generateContinuityDraft, MAX_CONTINUITY_CHARS } from '../lib/continuity-ai.js'

const selection = { provider: 'fixture', model: 'continuity', reasoningEffort: 'high' }
const chapter = {
  id: 1,
  novelId: 1,
  title: '钟楼雨夜',
  content: '雨落在钟楼的铁门上。沈砚把一枚铜钥匙藏进墙缝。远处的钟声忽然停了。',
  status: 'STATUS_LEAK_SENTINEL',
  token: 'not-for-prompt',
}
let passed = 0
async function check(name, run) {
  await run()
  passed += 1
  console.log(`PASS: ${name}`)
}
function fake(output, finish = 'stop', mutate = null) {
  const calls = []
  return {
    calls,
    async *stream(options) {
      calls.push(options)
      for (let offset = 0; offset < output.length; offset += 13) {
        yield { type: 'text-delta', index: 0, text: output.slice(offset, offset + 13) }
        if (mutate) mutate()
      }
      if (finish) yield { type: 'finish', reason: { kind: finish } }
    },
  }
}
const errorCode = code => error => {
  assert.equal(error.code, code)
  assert.ok(error.message.length > 3, 'errors should be readable')
  return true
}
const valid = {
  summary: '沈砚将铜钥匙藏入墙缝，钟声停下。',
  keyEvents: '沈砚藏起铜钥匙；远处钟声忽然停了。',
  cliffhanger: '钟声为何停下？',
  foreshadowing: [
    { title: '铜钥匙', detail: '沈砚把铜钥匙藏进墙缝。', evidence: '把一枚铜钥匙藏进墙缝' },
    { title: '失声的钟', detail: '钟声停止，原因未明。', evidence: '远处的钟声忽然停了' },
    { title: '无依据候选', detail: '模型不能凭空补证据。', evidence: '下一章出现了黑衣人' },
  ],
}
const encoded = JSON.stringify(valid)
try {
  assert.equal(MAX_CONTINUITY_CHARS, 24000)
  await check('单章提炼字段、字面证据过滤与模型选择参数', async () => {
    const llm = fake(`<think>ignored prelude</think>\n\`\`\`json\n${encoded}\n\`\`\``)
    const result = await generateContinuityDraft({ chapter, selection, llm })
    assert.deepEqual(result, { ...valid, foreshadowing: valid.foreshadowing.slice(0, 2) })
    assert.equal(llm.calls.length, 1)
    const options = llm.calls[0]
    assert.equal(options.provider, selection.provider)
    assert.equal(options.model, selection.model)
    assert.equal(options.reasoningEffort, 'high')
    assert.equal(options.maxTokens, 4000)
    const prompt = options.messages[0].content[0].text
    assert.match(prompt, /钟楼雨夜/)
    assert.match(prompt, /雨落在钟楼的铁门上/)
    assert.doesNotMatch(prompt, /not-for-prompt|STATUS_LEAK_SENTINEL|novelId|后文人物|其他章节/)
    assert.match(options.system, /JSON/i)
    assert.match(options.system + prompt, /不得.*回收|不.*判定.*回收/)
    assert.equal(options.signal, undefined)
  })

  await check('预先取消、空正文与超长正文在模型调用前拒绝', async () => {
    const llm = fake(encoded)
    await assert.rejects(generateContinuityDraft({ chapter: { ...chapter, content: ' \n ' }, selection, llm }), errorCode('EMPTY_CONTENT'))
    await assert.rejects(generateContinuityDraft({ chapter: { ...chapter, content: 'x'.repeat(MAX_CONTINUITY_CHARS + 1) }, selection, llm }), errorCode('CONTENT_TOO_LONG'))
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm, signal: controller.signal }), errorCode('ABORTED'))
    assert.equal(llm.calls.length, 0)
  })

  await check('非法结构、未知字段、长度和非法证据结构可读拒绝', async () => {
    const cases = [
      ['{"summary":', 'INVALID_CONTINUITY_JSON'],
      ['说明：' + encoded, 'INVALID_CONTINUITY_JSON'],
      ['<think>unfinished ' + encoded, 'INVALID_CONTINUITY_JSON'],
      ['```json\n' + encoded, 'INVALID_CONTINUITY_JSON'],
      [JSON.stringify({ ...valid, unknown: true }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, summary: 3 }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, summary: ' ' }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, summary: '字'.repeat(1001) }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, keyEvents: '字'.repeat(1501) }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, cliffhanger: '字'.repeat(601) }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, foreshadowing: Array(9).fill(valid.foreshadowing[0]) }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, foreshadowing: [{ ...valid.foreshadowing[0], evidence: 2 }] }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, foreshadowing: [{ ...valid.foreshadowing[0], extra: 'no' }] }), 'INVALID_CONTINUITY_DATA'],
      [JSON.stringify({ ...valid, foreshadowing: [{ ...valid.foreshadowing[0], detail: '字'.repeat(401) }] }), 'INVALID_CONTINUITY_DATA'],
    ]
    for (const [output, code] of cases) {
      await assert.rejects(generateContinuityDraft({ chapter, selection, llm: fake(output) }), errorCode(code))
    }
  })

  await check('只接受明确 stop；未完成流、工具调用和模型错误均不返回结果', async () => {
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm: fake(encoded, null) }), errorCode('INCOMPLETE_STREAM'))
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm: fake(encoded, 'tool-calls') }), errorCode('INCOMPLETE_STREAM'))
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm: fake(encoded, 'max-tokens') }), errorCode('MAX_TOKENS'))
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm: fake(encoded, 'error') }), errorCode('LLM_ERROR'))
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm: fake('x'.repeat(16001)) }), errorCode('OUTPUT_TOO_LONG'))
  })

  await check('流中取消并透传 signal，不会交付可写结果', async () => {
    const controller = new AbortController()
    const llm = fake(encoded, 'stop', () => controller.abort())
    await assert.rejects(generateContinuityDraft({ chapter, selection, llm, signal: controller.signal }), errorCode('ABORTED'))
    assert.equal(llm.calls.length, 1)
    assert.equal(llm.calls[0].signal, controller.signal)
  })
  console.log(`PASS: ${passed} continuity AI checks; fake LLM and in-memory chapter only.`)
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
