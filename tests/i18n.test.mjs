import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createI18n } from 'vue-i18n'

const require = createRequire(import.meta.url)
const messages = Object.fromEntries(['zh', 'en'].map(locale => [locale,
  JSON.parse(readFileSync(new URL(`../locales/lang/${locale}.json`, import.meta.url), 'utf8')),
]))
const translator = locale => createI18n({ legacy: false, locale, messages, missingWarn: false, fallbackWarn: false })

// 使用真实语言包加载业务显示逻辑；隔离宿主的浏览器初始化与无关筛选组件。
async function loadProduction(locale, entry) {
  globalThis.__repairI18nTest = translator(locale)
  const bundled = await build({
    entryPoints: [fileURLToPath(new URL(`../${entry}`, import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [{ name: 'host', setup(builder) {
      builder.onResolve({ filter: /^@jetlinks-web-core\// }, args => ({path: args.path, namespace: 'host'}))
      builder.onLoad({ filter: /.*/, namespace: 'host' }, ({ path }) => ({ contents:
        path.endsWith('/locales') ? 'export default globalThis.__repairI18nTest' :
          'export const encodeConditionFilterQuery = JSON.stringify; export const decodeConditionFilterQuery = JSON.parse',
      }))
    } }],
  })
  const module = {exports: {}}
  new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(require, module, module.exports)
  return module.exports
}

test('repair resource keys and interpolation parameters match in both languages', () => {
  const zh = messages.zh.ReportRepair, en = messages.en.ReportRepair
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort())
  const parameters = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
  for (const key of Object.keys(zh)) {
    assert.equal(typeof en[key], 'string', key)
    assert.equal(/[\p{Script=Han}]/u.test(en[key]), false, key)
    assert.deepEqual(parameters(zh[key]), parameters(en[key]), key)
    const t = translator('en').global.t
    const params = Object.fromEntries(parameters(en[key]).map(name => [name, 'Example']))
    assert.notEqual(t(`ReportRepair.${key}`, params), `ReportRepair.${key}`)
  }
})

test('persisted Chinese menu titles resolve through the shared menu renderer contract', () => {
  const en = translator('en').global.t, zh = translator('zh').global.t
  for (const name of ['首页统计', '报事记录', '报事配置', '报事审核', '报事流程配置', '有偿报事统计', '导出管理']) {
    assert.equal(zh(name), name)
    assert.equal(/[\p{Script=Han}]/u.test(en(name)), false, name)
    assert.notEqual(en(name), name)
  }
})

test('status, actions, review names, sources and dates use the selected language', async () => {
  const zh = await loadProduction('zh', 'utils.ts'), en = await loadProduction('en', 'utils.ts')
  assert.equal(zh.statusNames[0], '待分派')
  assert.equal(en.statusNames[0], 'Awaiting assignment')
  assert.equal(en.actionNames.dispatch, 'Assign')
  assert.equal(en.reviewNames.delay, 'Extension review')
  assert.equal(en.sourceName('物业自查'), 'Property inspection')
  assert.equal(en.sourceName('Custom source'), 'Custom source')
  assert.equal(en.displayName({name: '客户填写的名称'}), '客户填写的名称')
  const time = Date.UTC(2026, 10, 4, 13, 0)
  assert.notEqual(zh.formatTime(time), en.formatTime(time))
  assert.equal(en.formatTime(), '—')
  assert.throws(() => en.result({success: false}), /Operation failed/)
})

test('callback labels translate while stored values and completion restoration remain unchanged', async () => {
  const en = await loadProduction('en', 'services/actions.ts')
  assert.deepEqual(Object.keys(en.callbackMethodNames), ['电话', '登门', '现场', '短信'])
  assert.deepEqual(Object.values(en.callbackMethodNames), ['Phone', 'Home visit', 'On site', 'SMS'])
  assert.deepEqual(Object.keys(en.callbackResultNames), ['有效', '无效'])
  assert.equal(en.callbackResultNames['有效'], 'Valid')
  assert.equal(en.actionContent('follow', true).label, 'First follow-up content')
  const form = {}
  en.restoreCompletionForm(form, {materialAmount: 12, artificialAmount: 8}, {description: '业主原文', attachmentIds: ['file-1']})
  assert.equal(form.description, '业主原文')
  assert.deepEqual(form.attachmentIds, ['file-1'])
  assert.equal(form.materialAmount, 12)
})

test('report and filter labels translate without changing query field names or values', async () => {
  const en = await loadProduction('en', 'services/reports.ts')
  const fields = en.reportFields([{value:'project-1',label:'项目原名'}])
  assert.equal(fields.find(field => field.dataIndex === 'reportSource').search.options[0].value, 1)
  assert.equal(fields.find(field => field.dataIndex === 'reportSource').search.options[0].label, 'Property inspection')
  assert.equal(fields.find(field => field.dataIndex === 'businessProjectId').search.options[0].label, '项目原名')
  assert.equal(en.reportColumns('node').find(column => column.key === 'waitAccept').title, 'Awaiting acceptance')
  assert.equal(en.reportPages.evaluationManagement.mode, 'evaluation')
})

test('form validation uses English errors and preserves valid issue data', async () => {
  const en = await loadProduction('en', 'services/intake.ts')
  const form = {businessProjectId:'project-1',channelId:'channel-1',categoryId:'category-3',labelIds:['tag-1'],contactName:'Owner',contactPhone:'13800000000',description:'房屋漏水'}
  assert.equal(en.intakeError(form, ['category-1','category-2','category-3'], false), undefined)
  assert.equal(en.intakeError(form, ['category-1','category-2','category-3'], true), 'Wait for attachments to finish uploading')
  assert.equal(en.intakeError({...form, businessProjectId:''}, [], false), 'Select a reporting project')
  assert.equal(form.description, '房屋漏水')
})


test('declarative workflow node and branch labels resolve in both languages', () => {
  const source = readFileSync(new URL('../components/RepairWorkflowDiagram.vue', import.meta.url), 'utf8')
  const keys = [...source.matchAll(/label:'(\w+)'/g)].map(match => match[1])
  assert(keys.length > 30)
  for (const locale of ['zh', 'en']) {
    const t = translator(locale).global.t
    for (const key of keys) assert.notEqual(t(`ReportRepair.${key}`), `ReportRepair.${key}`, key)
  }
})

test('anonymous QR requests send language while keeping authentication and upload headers isolated', async () => {
  const api = await loadProduction('en', 'api/public.ts')
  const originalFetch = globalThis.fetch, calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({url, options})
    return {ok: true, json: async () => ({status: 200, result: {number: 'TEST-001'}})}
  }
  try {
    await api.getPublicRepairForm('code with space')
    assert.equal(calls[0].url, '/api/repair/public/qr/code%20with%20space')
    assert.deepEqual(calls[0].options.headers, {'Accept-Language':'en'})
    assert.equal(calls[0].options.credentials, 'omit')
    await api.submitPublicRepair('test', {description:'Original content'})
    assert.deepEqual(calls[1].options.headers, {'Accept-Language':'en','Content-Type':'application/json'})
    await api.uploadPublicRepairFile('test', new File(['sample'], 'sample.png', {type:'image/png'}))
    assert.deepEqual(calls[2].options.headers, {'Accept-Language':'en'})
    assert(calls[2].options.body instanceof FormData)
    globalThis.fetch = async () => ({ok: false, json: async () => ({status: 404})})
    await assert.rejects(api.getPublicRepairForm('missing'), /This QR code is unavailable/)
  } finally { globalThis.fetch = originalFetch }
})
