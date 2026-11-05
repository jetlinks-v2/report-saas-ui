import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createI18n } from 'vue-i18n'

const require = createRequire(import.meta.url)
const messages = Object.fromEntries(['zh', 'en'].map(locale => [locale,
  JSON.parse(readFileSync(new URL(`../locales/lang/${locale}.json`, import.meta.url), 'utf8')),
]))

async function load(locale = 'en') {
  const resources = new Map()
  globalThis.__repairSharedBase = { resources, i18n: createI18n({ legacy: false, locale, messages }) }
  const bundled = await build({
    entryPoints: [fileURLToPath(new URL('../api/propertyBase.ts', import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [{ name: 'host', setup(builder) {
      builder.onResolve({ filter: /^@jetlinks-web-core\// }, args => ({ path: args.path, namespace: 'host' }))
      builder.onLoad({ filter: /.*/, namespace: 'host' }, ({ path }) => ({ contents:
        path.endsWith('/locales') ? 'export default globalThis.__repairSharedBase.i18n' :
          `export const moduleRegistry = { getResourceItem(moduleId, kind, name) {
            if (moduleId !== 'property-base-ui' || kind !== 'apis') throw Error('Wrong resource owner')
            return globalThis.__repairSharedBase.resources.get(name)
          } }`,
      }))
    } }],
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(require, module, module.exports)
  return { api: module.exports, resources }
}

test('missing public module is explicit and resources are resolved after registration', async () => {
  const { api, resources } = await load()
  await assert.rejects(api.queryProjects(), /Property base management is unavailable/)
  await assert.rejects(api.queryProjectSpaces('p1'), /Property base management is unavailable/)
  resources.set('getProjectOptions', async () => ({ status: 'ready', options: [{ id: 'p1', name: '项目原名' }] }))
  assert.deepEqual(await api.queryProjects(), { success: true, result: [{ id: 'p1', name: '项目原名' }] })
  resources.set('getProjectOptions', async () => ({ status: 'ready', options: [] }))
  assert.deepEqual((await api.queryProjects()).result, [])
})

test('not configured and permission failures remain distinct from successful empty options', async () => {
  const { api, resources } = await load('zh')
  resources.set('getProjectOptions', async () => ({ status: 'notConfigured' }))
  await assert.rejects(api.queryProjects(), /物业基础项目查询尚未配置/)
  const denied = new Error('Access denied')
  resources.set('getProjectOptions', async () => { throw denied })
  await assert.rejects(api.queryProjects(), error => error === denied)
})

test('project scope reaches public API and space normalization keeps hierarchy and IDs', async () => {
  const { api, resources } = await load()
  const calls = []
  const spaces = [{ id: 'root', name: '楼宇', version: 3, leaf: false, parentId: null, organizationId: null,
    children: [{ id: 'room', name: '房屋', version: 1, leaf: true, parentId: 'root', organizationId: 'p2' }] }]
  resources.set('getSpaceTree', async projectId => { calls.push(projectId); return spaces })
  const response = await api.queryProjectSpaces('p2')
  assert.deepEqual(calls, ['p2'])
  assert.equal(response.success, true)
  assert.equal(response.result[0].parentId, undefined)
  assert.equal(response.result[0].organizationId, undefined)
  assert.equal(response.result[0].children[0].parentId, 'root')
  assert.equal(response.result[0].children[0].organizationId, 'p2')
  assert.equal(spaces[0].parentId, null)
  const denied = new Error('Space forbidden')
  resources.set('getSpaceTree', async () => { throw denied })
  await assert.rejects(api.queryProjectSpaces('p3'), error => error === denied)
})

test('repair owns no public management menu or page copy', () => {
  const menus = JSON.parse(readFileSync(new URL('../baseMenu.json', import.meta.url), 'utf8'))
  assert.deepEqual(menus, [])
  for (const path of ['api/system-management', 'hooks/system-management', 'views/system-management', 'utils/system-management']) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false, path)
  }
  for (const locale of ['zh', 'en']) assert.equal(messages[locale].ReportSystem, undefined)
})
