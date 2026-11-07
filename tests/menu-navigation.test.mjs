import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('..', import.meta.url))
const host = process.env.RUNTIME_UI_ROOT || [resolve(root, '../../..', 'sass平台/cloud.jetlinks/runtime-ui'), resolve(root, '../..')]
  .find(path => existsSync(resolve(path, 'jetlinks-web-core/src/utils/modules.ts')))
assert(host, 'Set RUNTIME_UI_ROOT to the runtime-ui checkout')
const require = createRequire(resolve(host, 'package.json'))
const {build} = require('esbuild')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const menuDefinitions = readJson(resolve(root, 'baseMenu.json'))
const rootId = 'repair-95ba1c0107da4cfe928acf91df0197ae'
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])])

async function load(entry) {
  const bundled = await build({
    entryPoints:[resolve(root, entry)], bundle:true, write:false, format:'cjs', platform:'node', external:['vue'],
    plugins:[{name:'host', setup(builder) {
      builder.onResolve({filter:/^@jetlinks-web-core\/locales$/}, () => ({path:'locales',namespace:'mock'}))
      builder.onResolve({filter:/\.vue$/}, ({path}) => ({path,namespace:'mock'}))
      builder.onLoad({filter:/.*/,namespace:'mock'}, ({path}) => ({contents:path === 'locales'
        ? 'export default {global:{t:key=>key}}' : 'export default {}'}))
      builder.onResolve({filter:/^@jetlinks-web-core\//}, ({path}) => ({path:resolve(host,'jetlinks-web-core/src',path.replace('@jetlinks-web-core/','')+'.ts')}))
      builder.onResolve({filter:/^@jetlinks-web\/utils$/}, () => ({path:resolve(host,'node_modules/@jetlinks-web/utils/src/config.ts')}))
      builder.onLoad({filter:/index\.ts$/}, ({path}) => ({contents:readFileSync(path,'utf8').replaceAll('import.meta.glob','(() => ({}))'),loader:'ts',resolveDir:dirname(path)}))
    }}],
  })
  const module = {exports:{}}
  new Function('require','module','exports',bundled.outputFiles[0].text)(require,module,module.exports)
  return module.exports
}
const {repairMenuFilter} = await load('services/menuNavigation.ts')
const filter = repairMenuFilter.filter
const application = {applicationScope:'test-repair-app'}

test('根节点复用旧 ID，系统管理保留原菜单及五个页面', async () => {
  const [menu] = (await load('baseMenu.ts')).default()
  assert.equal(menu.id,rootId)
  assert.equal(menu.name,'报事报修')
  assert.equal(menu.options.show,true)
  assert.equal(menu.options.appName,'report-repair-ui')
  assert.equal(menu.children.at(-1).id,'repair-system-basic')
  assert.deepEqual(menu.children.at(-1).children.map(node=>node.id), [
    'repair-system-OrganizationType','repair-system-User','repair-system-Space','repair-system-Customer','repair-system-Dictionary',
  ])
})

test('前端独立提供全部39个菜单，业务分组、组件、按钮和资产权限完整', () => {
  const definitions = flatten(menuDefinitions)
  assert.equal(definitions.length,39)
  assert.equal(new Set(definitions.map(node=>node.id)).size,definitions.length)
  const [menuRoot] = menuDefinitions
  assert.equal(menuRoot.id,rootId)
  assert.deepEqual(menuRoot.permissions,[])
  assert.deepEqual(menuRoot.buttons,[])
  assert.deepEqual(menuRoot.children.map(node=>node.name),['首页统计','报事处理','报事统计','报事配置','承接查验','系统管理'])
  const records = definitions.find(node=>node.id==='repair-ae6a50b29308426b932b94d33f8bab18')
  assert.equal(records.url,'/businessProcessing/reportedThatRecords')
  assert.equal(records.options.meta.componentCode,'repair/Orders')
  assert.deepEqual(records.assetTypes,['repairOrder','file','device'])
  assert(records.buttons.some(button=>button.permissions?.some(permission=>permission.permission==='repair-order')))
  for (const menu of definitions.filter(node=>node.showPage?.length && node.options?.show !== false)) {
    const component = menu.options?.meta?.componentCode
    assert(component,menu.id)
    assert(existsSync(resolve(root,'views',component,'index.vue')),component)
  }
})

test('宿主初始化能按后端权限保留完整业务树，并过滤未授权页面与按钮', async () => {
  const source = readFileSync(resolve(host,'jetlinks-web-core/src/views/init-home/Menu/index.vue'),'utf8')
  const start = source.indexOf('const filterMenuByPermission =')
  const end = source.indexOf('\n};',start)
  assert(start >= 0 && end > start,'宿主菜单权限过滤器存在')
  const result = await build({stdin:{contents:source.slice(start,end+3)+'\nexport default filterMenuByPermission',loader:'ts'},write:false,format:'cjs',platform:'node'})
  const module = {exports:{}}
  new Function('module','exports',result.outputFiles[0].text)(module,module.exports)
  const filterByPermission = module.exports.default
  const permissions = [...new Set(flatten(menuDefinitions).flatMap(node=>node.showPage || []))]
  const menus = filterByPermission(permissions,structuredClone(menuDefinitions),true)
  assert.deepEqual(menus[0].children.map(node=>node.name),['首页统计','报事处理','报事统计','报事配置','系统管理'])
  const actualIds = new Set(flatten(menus).map(node=>node.id))
  for (const id of ['repair-ae6a50b29308426b932b94d33f8bab18','repair-75a9b512659a4a5aa0ed2157ae4d0cd9','repair-b3df273261f340a4bef03c55817c9d81','repair-qr-configuration','repair-0593f6e90e2c4b30a6b2e9f2c73d4106']) {
    assert(actualIds.has(id),id)
  }
  const limited = filterByPermission(['repair-order'],structuredClone(menuDefinitions),true)
  assert(!flatten(limited).some(menu=>menu.id==='repair-qr-configuration'))
  assert(!flatten(limited).some(menu=>menu.id==='repair-system-User'))
  assert.deepEqual(filterByPermission([],structuredClone(menuDefinitions),true),[])
})

test('项目上下文及无应用上下文保持完整授权树', () => {
  const menus = structuredClone(menuDefinitions)
  for (const applicationScope of [undefined,'','__jetlinks_project__','business_application:__jetlinks_project__']) {
    assert.equal(filter(menus,{applicationScope}),menus)
  }
})

test('独立应用只展开报修根，二级页面、按钮和数据范围不变，系统管理末位', () => {
  const menus = structuredClone(menuDefinitions), before = structuredClone(menus)
  const system = menus[0].children.pop()
  menus[0].children.unshift(system)
  const navigation = filter(menus,application)
  assert.deepEqual(navigation,before[0].children)
  assert.deepEqual(menus[0].children,[system,...before[0].children.slice(0,-1)])
  assert.deepEqual(filter(navigation,application),navigation)
})

test('不补未授权菜单，不改其他系统，不展开项目内其他根节点', () => {
  const [root] = structuredClone(menuDefinitions), allowed = root.children[1]
  const other = {id:'other',code:'other',name:'其他系统',url:'/other',children:[{id:'other-page'}]}
  assert.deepEqual(filter([other,{...root,children:[allowed]}],application),[other,allowed])
  assert.deepEqual(filter([{...root,children:[]}],application),[])
  assert.deepEqual(filter([other],application),[other])
  const partial = {...root,children:[{...allowed,children:[allowed.children[0]]}]}
  assert.deepEqual(filter([partial],application),partial.children)
})

test('模块出口接入过滤器，公开报事入口与工单提醒扩展继续保留', async () => {
  const module = (await load('index.ts')).default
  assert.equal(module.getMenuFilters()[0].code,repairMenuFilter.code)
  assert.equal(module.getCoreRouteOverrides()[0].name,'repair-public-intake')
  assert.equal(module.getCoreRouteOverrides()[0].meta.skipMenuFetch,true)
  assert.equal(module.getRegisterComponents()[0].code,'repair-order-sound')
})
