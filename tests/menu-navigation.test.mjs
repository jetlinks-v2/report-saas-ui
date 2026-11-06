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
const backend = process.env.REPAIR_BACKEND_ROOT || [resolve(root, '../../property-management'), resolve(root, '../../../modules/property-management')]
  .find(path => existsSync(resolve(path, 'deploy/repair/menus.json')))
assert(backend, 'Set REPAIR_BACKEND_ROOT to property-management')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const definitions = readJson(resolve(backend, 'deploy/repair/menus.json'))
const grants = readJson(resolve(backend, 'deploy/repair/template-grant.json'))
const rootId = 'repair-95ba1c0107da4cfe928acf91df0197ae'
const tree = (nodes, parentId = '-1') => nodes.filter(node => node.parentId === parentId)
  .sort((a, b) => a.sortIndex - b.sortIndex)
  .map(node => ({...node, children:tree(nodes, node.id)}))

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

// 公共管理由 property-base-ui 提供；兼容已持久化的旧授权树，不重建公共页面。
test('报修不再重复初始化公共管理菜单，部署业务授权无重复', async () => {
  assert.deepEqual((await load('baseMenu.ts')).default(), [])
  for (const nodes of [definitions, grants.menus]) {
    assert.equal(new Set(nodes.map(node => node.id)).size, nodes.length)
  }
})

test('后端业务授权保留系统根及层级，根节点不新增业务权限', () => {
  const root = grants.menus.find(node => node.id === rootId)
  assert(root)
  assert.deepEqual(root.permissions || [], [])
  assert.deepEqual(root.buttons || [], [])
  assert.deepEqual(root.assetAccesses || [], [])
  for (const granted of grants.menus) {
    const definition = definitions.find(node => node.id === granted.id)
    assert(definition, granted.id)
    for (const key of ['parentId', 'path', 'level', 'code', 'url']) {
      assert.deepEqual(granted[key], definition[key], `${granted.id}:${key}`)
    }
  }
})

const authorizedMenus = () => [{id:rootId,code:rootId,name:'报事报修',children:[
  {id:'overview',code:'overview'},
  {id:'processing',code:'processing',buttons:[{id:'query'}],assetAccesses:[{type:'organization'}],children:[{id:'records'}]},
  {id:'statistics',code:'statistics'},
  {id:'configuration',code:'configuration'},
  {id:'repair-system-basic',code:'system-management/basic',children:[{id:'existing-authorized-page'}]},
]}]

test('项目上下文及无应用上下文保持完整授权树', () => {
  const menus = authorizedMenus()
  for (const applicationScope of [undefined,'','__jetlinks_project__','business_application:__jetlinks_project__']) {
    assert.equal(filter(menus,{applicationScope}),menus)
  }
})

test('独立应用只展开报修根，二级页面、按钮和数据范围不变，系统管理末位', () => {
  const menus = authorizedMenus(), before = structuredClone(menus)
  const system = menus[0].children.pop()
  menus[0].children.unshift(system)
  const navigation = filter(menus,application)
  assert.deepEqual(navigation,before[0].children)
  assert.deepEqual(menus[0].children,[system,...before[0].children.slice(0,-1)])
  assert.deepEqual(filter(navigation,application),navigation)
})

test('不补未授权菜单，不改其他系统，不展开项目内其他根节点', () => {
  const [root] = authorizedMenus(), allowed = root.children[1]
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
