import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'
import { createRenderer, reactive, ref, nextTick, effectScope } from 'vue'
const require=createRequire(import.meta.url),ok=result=>({success:true,result})
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
const flush=async()=>{await nextTick();await new Promise(r=>setImmediate(r));await nextTick()}
async function load(entry,state){
 globalThis.__repairInteraction=state
 const out=await build({entryPoints:[fileURLToPath(new URL('../'+entry,import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['vue'],plugins:[{name:'host',setup(b){
 b.onResolve({filter:/^vue-router$|^ant-design-vue$|^@jetlinks-web-core\//},a=>({path:a.path,namespace:'mock'}))
 b.onResolve({filter:/^\.\.\/api$/},()=>({path:'api',namespace:'mock'}))
 b.onLoad({filter:/.*/,namespace:'mock'},({path})=>({contents:path==='api'?Object.keys(state.api||{}).map(k=>`export const ${k}=(...args)=>globalThis.__repairInteraction.api.${k}(...args)`).join(';'):
 path==='vue-router'?'export const useRoute=()=>globalThis.__repairInteraction.route;export const useRouter=()=>({replace:async()=>{},push:value=>{globalThis.__repairInteraction.pushed=value}})':
 path==='ant-design-vue'?'export const message={warning:()=>{},success:()=>{}}':
 path.endsWith('/locales')?'export default {global:{t:key=>key,locale:{value:"zh"}}}':
 path.endsWith('/utils')?'export const getImageUrl=id=>"/file/"+id':
 'export const buildQueryFilter=terms=>({terms});export const encodeConditionFilterQuery=terms=>terms.length?JSON.stringify(terms):"";export const decodeConditionFilterQuery=()=>[]'}))
 }}]})
 const module={exports:{}};new Function('require','module','exports',out.outputFiles[0].text)(require,module,module.exports);return module.exports
}
const renderer=createRenderer({createElement:()=>({}),insert:()=>{},remove:()=>{},setElementText:()=>{},patchProp:()=>{},createText:()=>({}),createComment:()=>({}),setText:()=>{},setComment:()=>{},parentNode:()=>null,nextSibling:()=>null})
async function orders(overrides={}){
 const state={route:reactive({path:'/businessProcessing/reportedThatRecords',query:{}}),api:{queryProjects:async()=>ok([]),getAuthorization:async()=>ok({user:{id:'u'},permissions:[]}),queryOrders:async()=>ok({data:[{id:'o'}],total:1}),queryStatusCounts:async()=>ok([{total:1}]),queryReviewOrders:async()=>ok({data:[],total:0}),...overrides}}
 const {useOrders}=await load('hooks/useOrders.ts',state);let hook
 const app=renderer.createApp({setup(){hook=useOrders();return()=>null}});app.mount({});await flush();return {state,hook,app}
}
test('list does not wait for counters; pagination reuses them',async()=>{
 const summary=deferred();let calls=0
 const {hook,app}=await orders({queryStatusCounts:()=>{calls++;return summary.promise}})
 assert.equal(hook.loading.value,false);assert.equal(hook.rows.value[0].id,'o')
 hook.pageChange({current:2});await flush();assert.equal(calls,1)
 summary.resolve(ok([{total:12,handling:5}]));await flush();assert.equal(hook.counts.value.all,12);app.unmount()
})
test('transfer opens immediately, loads bounded defaults and ignores stale searches after navigation',async()=>{
 const candidates=deferred();const calls=[]
 const {state,hook,app}=await orders({getAssignees:(...args)=>{calls.push(args);return candidates.promise}})
 hook.selected.value={id:'o',assignedUserId:'u',status:1}
 await hook.startAction('transfer');assert.equal(hook.actionOpen.value,true);assert.equal(hook.optionsLoading.value,false)
 await new Promise(r=>setTimeout(r,10));assert.deepEqual(calls[0],['o','transfer','',5]);assert.equal(hook.peopleLoading.value,true)
 hook.searchAssignees('张');await new Promise(r=>setTimeout(r,330));assert.deepEqual(calls[1],['o','transfer','张',20])
 state.route.path='/businessProcessing/exportMatter';await flush();assert.equal(hook.actionOpen.value,false)
 candidates.resolve(ok([{id:'p',displayName:'候选人'}]));await flush();assert.equal(hook.actionOpen.value,false);assert.deepEqual(hook.personOptions.value,[]);app.unmount()
})
test('assignees show defaults, reload after clearing search and expose request failures',async()=>{
 let fail=false
 const {hook,app}=await orders({getAssignees:async()=>{if(fail)throw Error('directory unavailable');return ok([{id:'u',displayName:'原责任人'},{id:'p',displayName:'新责任人'}])}})
 hook.selected.value={id:'o',assignedUserId:'u',status:1};await hook.startAction('transfer');await new Promise(r=>setTimeout(r,10));await flush()
 assert.deepEqual(hook.personOptions.value,[{value:'p',label:'新责任人'}]);assert.equal(hook.peopleLoading.value,false)
 hook.searchAssignees('');await new Promise(r=>setTimeout(r,330));await flush();assert.equal(hook.personOptions.value.length,1)
 fail=true;hook.searchAssignees('missing');await new Promise(r=>setTimeout(r,330));await flush()
 assert.equal(hook.peopleError.value,'directory unavailable');assert.equal(hook.peopleLoading.value,false);app.unmount()
})
test('create state closes on audit and export menu switches',async()=>{
 const {state,hook,app}=await orders()
 await hook.startCreate();assert.equal(hook.intake.open,true)
 state.route.path='/businessProcessing/newsstandAudit';await flush();assert.equal(hook.intake.open,false);assert.equal(hook.auditMode.value,true)
 await hook.startCreate();state.route.path='/businessProcessing/exportMatter';await flush();assert.equal(hook.intake.open,false);app.unmount()
})
test('attachment reducer preserves concurrent uploads and handles removal and errors',async()=>{
 const {useAttachments}=await load('hooks/useAttachments.ts',{})
 const ids=ref([]);let busy;const scope=effectScope();let hook
 scope.run(()=>{hook=useAttachments(ids,v=>{ids.value=v},v=>{busy=v})})
 const done={uid:'a',name:'a',status:'done',originFileObj:{},response:{status:200,result:{id:'file-a'}}},upload={uid:'b',name:'b',status:'uploading',originFileObj:{}}
 hook.change({file:done,fileList:[done,upload]});await flush();assert.deepEqual(ids.value,['file-a']);assert.equal(hook.files.value.length,2);assert.equal(busy,true)
 hook.change({file:upload,fileList:[done,{...upload,status:'error'}]});await flush();assert.equal(busy,true)
 hook.remove(upload);await flush();assert.equal(busy,false);assert.deepEqual(ids.value,['file-a'])
 hook.remove(done);await flush();assert.deepEqual(ids.value,[]);scope.stop()
})
test('overview restores the original donut with only the ten largest categories',async()=>{
 const summary=[{projectId:'a',total:100,completed:50,abandoned:10,withDeadline:50,timelyCompleted:40,ownerEvaluated:20,ownerPositive:15},{projectId:'b',total:10,completed:10,withDeadline:10,timelyCompleted:5,ownerEvaluated:1,ownerPositive:1}]
 const state={route:reactive({path:'/overview',query:{}}),api:{queryStatistics:async()=>ok(summary),queryDashboard:async()=>ok({trend:[],urgency:[],category:Array.from({length:80},(_,i)=>({name:'分类'+i,total:1}))})}}
 const {useOverview}=await load('hooks/useOverview.ts',state);let hook
 const app=renderer.createApp({setup(){hook=useOverview();return()=>null}});app.mount({});await flush()
 assert.deepEqual(hook.cards.value.map(c=>c.count),[110,60,75,76.19]);assert.equal(hook.cards.value.length,4)
 assert.equal(hook.categoryOption.value.series[0].data.length,10)
 assert.equal(hook.categoryOption.value.series[0].type,'pie')
 assert.deepEqual(hook.categoryOption.value.series[0].radius,['40%','65%'])
 assert.equal(hook.categoryOption.value.legend.bottom,0)
 assert.equal(hook.projects.value[0].rate,90.91)
 const categories=Array.from({length:12},(_,i)=>({name:'分类'+i,total:i+1}))
 hook.dashboard.value.category=categories
 assert.deepEqual(hook.categoryOption.value.series[0].data,categories.slice(2).reverse().map(row=>({name:row.name,value:row.total})))
 assert.equal(hook.dashboard.value.category.length,12)
 assert.equal(hook.dashboard.value.category[0].name,'分类0')
 hook.dashboard.value.category=[{name:'工程',total:8},{name:'保洁',total:2}]
 assert.equal(hook.categoryOption.value.series[0].data.length,2)
 hook.dashboard.value.category=[]
 assert.deepEqual(hook.categoryOption.value.series[0].data,[])
 app.unmount()
})

test('inline image previews classify via a one-byte request and preserve document downloads',async()=>{
 const original=globalThis.fetch,originalWindow=globalThis.window;globalThis.window={location:{href:'https://example.test/'}};let calls=[]
 try{
   globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(new Uint8Array([0]),{status:206,headers:{'content-type':url.includes('/file/image')?'image/png':'application/pdf','content-disposition':"inline; filename*=UTF-8''%E6%8A%A5%E4%BA%8B.png"}})}
   const {attachmentPreview}=await load('services/attachments.ts',{})
   const signal=new AbortController().signal
   const image=await attachmentPreview('image',signal),document=await attachmentPreview('doc',signal)
   assert.equal(image.image,true);assert.equal(image.name,'报事.png');assert.equal(document.image,false)
   assert.equal(new URL(calls[0].url).searchParams.get('attachment'),'true');assert.equal(calls[0].options.headers.Range,'bytes=0-0');assert.equal(calls[0].options.signal,signal)
   globalThis.fetch=async()=>new Response('',{status:403});await assert.rejects(attachmentPreview('denied',signal),/403/)
 }finally{globalThis.fetch=original;globalThis.window=originalWindow}
})

test('all supported detail action buttons open their form and expose loading failures',async()=>{
 const {hook,app}=await orders({queryConfigurations:async()=>ok({data:[],total:0})})
 hook.selected.value={id:'o',status:1,version:1,businessProjectId:'p',paid:false,assignedUserId:'u'}
 for(const name of ['dispatch','transfer','accept','grab','follow','finish','callback','delay','close','changeLevel','changeCategory','abandonApply','review','evaluate','ownerEvaluate','toPaid','quote','sign','urge']){
   await hook.startAction(name);assert.equal(hook.actionOpen.value,true,name);assert.equal(hook.optionsLoading.value,false,name);assert.equal(hook.error.value,'',name)
   hook.actionOpen.value=false;await flush()
 }
 app.unmount()
})

test('every date selection reloads all cards and charts with identical dates, and drill-down retains them',async()=>{
 const calls=[];let total=10
 const state={route:reactive({path:'/overview',query:{}}),api:{queryStatistics:async q=>{calls.push(['statistics',q]);return ok([{projectId:'p',projectName:'项目',total,completed:total/2,withDeadline:total/2,timelyCompleted:total/4,ownerEvaluated:total/2,ownerPositive:total/4}])},queryDashboard:async q=>{calls.push(['dashboard',q]);return ok({trend:[],urgency:[],category:[{name:'分类',total}]})}}}
 const {useOverview}=await load('hooks/useOverview.ts',state);let hook
 const app=renderer.createApp({setup(){hook=useOverview();return()=>null}});app.mount({});await flush()
 assert.equal(hook.cards.value[0].count,10);assert.deepEqual(calls[0][1],calls[1][1]);assert.equal(calls[0][1].terms[0].column,'createTime')
 total=20;hook.changePeriod('month');await flush();assert.equal(hook.cards.value[0].count,20);assert.deepEqual(calls[2][1],calls[3][1]);assert.notDeepEqual(calls[0][1],calls[2][1])
 hook.range.value=[hook.range.value[0].subtract(2,'month'),hook.range.value[1].subtract(2,'month')];hook.changeRange();await flush();assert.equal(calls.length,6);assert.deepEqual(calls[4][1],calls[5][1])
 hook.openOrders('p');const terms=JSON.parse(state.pushed.query.q);assert.deepEqual(terms[0],calls[4][1].terms[0]);assert.equal(terms[1].value,'p');assert(hook.periodLabel.value);app.unmount()
})
test('fast date switches cannot replace the latest metrics with an older response',async()=>{
 const first=deferred();let request=0
 const state={route:reactive({path:'/overview',query:{}}),api:{queryStatistics:()=>++request===1?first.promise:Promise.resolve(ok([{total:7}])),queryDashboard:async()=>ok({trend:[],urgency:[],category:[]})}}
 const {useOverview}=await load('hooks/useOverview.ts',state);let hook
 const app=renderer.createApp({setup(){hook=useOverview();return()=>null}});app.mount({});await flush();hook.changePeriod('year');await flush();assert.equal(hook.cards.value[0].count,7)
 first.resolve(ok([{total:100}]));await flush();assert.equal(hook.cards.value[0].count,7);app.unmount()
})
