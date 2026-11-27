import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { unstable_readConfig, unstable_startWorker } from 'wrangler'
import { createApp } from '@missing-elements/h5p-mcp/app'
import { OPTIONS } from '../src/options.mjs'

/**
 * The Worker as Cloudflare runs it, bundled by wrangler and asked over HTTP in the Workers runtime:
 * it must answer as the server on a computer does, word for word, and its config keep logs off.
 */

const CONFIG = resolve(import.meta.dirname, '../wrangler.jsonc')
const META = { language: 'en', license: 'U', authors: [{ name: 'Unknown', role: 'Author' }] }
const QUIZ = { ...META, type: 'H5P.TrueFalse', title: 'Boiling point', params: { question: '<p>Water boils at 100 °C at sea level.</p>', correct: 'true' } }

type Asked = (request: Request) => Promise<Response>

let worker: Awaited<ReturnType<typeof unstable_startWorker>>
/** The Worker, and the server as Node runs it, each asked the same way. */
let hosted: Asked
let local: Asked
let server: Awaited<ReturnType<typeof createApp>>

/** One call of the protocol's, answered: its result, or the error it came back with. */
async function ask(asked: Asked, method: string, params: unknown = {}) {
  const response = await asked(new Request('https://host.example/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  }))
  const text = await response.text()
  const { result, error } = JSON.parse(text.split('\n').find((line) => line.startsWith('data: '))?.slice(6) ?? text)
  return result ?? { error }
}

beforeAll(async () => {
  worker = await unstable_startWorker({ config: CONFIG, dev: { server: { hostname: '127.0.0.1', port: 0 }, inspector: false, logLevel: 'error', watch: false } })
  await worker.ready
  const origin = await worker.url
  hosted = (request) => fetch(new Request(new URL(new URL(request.url).pathname, origin), request))
  server = await createApp(OPTIONS)
  local = (request) => server.fetch(request)
})

afterAll(async () => {
  await worker?.dispose()
  await server?.close()
})

describe('the app server as a Worker', () => {
  it('names itself and its tools as the server on a computer does', async () => {
    const hello = { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } }
    expect(await ask(hosted, 'initialize', hello)).toEqual(await ask(local, 'initialize', hello))
    expect((await ask(hosted, 'initialize', hello)).serverInfo.title).toBe('EmbedMy Lesson')
    const { tools } = await ask(hosted, 'tools/list')
    expect(tools.map((tool: { name: string }) => tool.name)).toEqual(['h5p_types', 'h5p_play'])
    expect(tools).toEqual((await ask(local, 'tools/list')).tools)
  })

  it('reads the pack, the type files and the brief it carries', async () => {
    // The list opens every content type's part, and carries the brief; a type with a file
    // answers from it, and one without from the fields in its part.
    for (const args of [{}, { type: 'H5P.TrueFalse' }, { type: 'H5P.Crossword' }]) {
      const answer = await ask(hosted, 'tools/call', { name: 'h5p_types', arguments: args })
      expect(answer.isError).toBeUndefined()
      expect(answer).toEqual(await ask(local, 'tools/call', { name: 'h5p_types', arguments: args }))
    }
  })

  it('checks a source, and refuses one, in the same words', async () => {
    for (const source of [QUIZ, { type: 'H5P.TrueFalse' }]) {
      const answer = await ask(hosted, 'tools/call', { name: 'h5p_play', arguments: { source } })
      expect(answer).toEqual(await ask(local, 'tools/call', { name: 'h5p_play', arguments: { source } }))
    }
    expect((await ask(hosted, 'tools/call', { name: 'h5p_play', arguments: { source: QUIZ } })).content[0].text).toContain('The activity is checked and plays in the card: H5P.TrueFalse')
  })

  it('serves the same card at the same address, so a chat keeps one', async () => {
    const { resources } = await ask(hosted, 'resources/list')
    expect(resources[0].uri).toBe(server.cardUri)
    expect(await ask(hosted, 'resources/read', { uri: server.cardUri })).toEqual(await ask(local, 'resources/read', { uri: server.cardUri }))
    // And an earlier card's address, for a chat that kept one from before a change (#278).
    const earlier = 'ui://h5p-play/card-df8ccbdd2aa8.html'
    expect((await ask(hosted, 'resources/read', { uri: earlier })).contents[0].text).toBe((await ask(local, 'resources/read', { uri: server.cardUri })).contents[0].text)
  })

  it('serves the h5p-author skill it carries, as the server on a computer does', async () => {
    // Skills over MCP (#280): the same entry, every file listed, and the files read the same.
    const listed = await ask(hosted, 'skills/list')
    expect(listed).toEqual(await ask(local, 'skills/list'))
    expect(listed.skills.map((skill: { uri: string }) => skill.uri)).toEqual(['skill://h5p-author/SKILL.md'])
    for (const { uri } of listed.skills[0].resources) expect(await ask(hosted, 'resources/read', { uri })).toEqual(await ask(local, 'resources/read', { uri }))
  })

  it('answers the endpoint and nothing else, and no body over 1 MB', async () => {
    const at = (path: string, init?: RequestInit) => hosted(new Request(`https://host.example${path}`, init))
    expect((await at('/')).status).toBe(200)
    // What it carries is not served: the files are the Worker's own.
    for (const path of ['/card.html', '/parts/index.json', '/bundle/card.html', '/references/authoring.md']) expect((await at(path)).status).toBe(404)
    const big = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'h5p_play', arguments: { source: { pad: 'x'.repeat(1100_000) } } } })
    expect((await at('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: big })).status).toBe(413)
  })

  it('is configured to write no log of a call, with no store and one address', () => {
    const config = unstable_readConfig({ config: CONFIG })
    expect(config.observability).toMatchObject({ enabled: false })
    expect(config.workers_dev).toBe(false)
    expect(config.preview_urls).toBe(false)
    expect(config.routes).toEqual([{ pattern: 'mcp.embed-my.org', custom_domain: true }])
    // No store is bound to it: nothing it could keep a call in.
    for (const store of ['kv_namespaces', 'r2_buckets', 'd1_databases', 'queues', 'durable_objects', 'analytics_engine_datasets', 'tail_consumers'] as const) {
      const bound = (config as unknown as Record<string, unknown>)[store]
      expect(Array.isArray(bound) ? bound : Object.values((bound ?? {}) as object).flat(), store).toHaveLength(0)
    }
  })
})
