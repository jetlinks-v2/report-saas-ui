import { computed,onMounted,ref,watch } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import * as api from '../api/repair'
import { errorText } from '../api/http'
import { listQuery,type ListMode } from '../services/queries'
import { state } from '../services/session'
import {statusOptions,todoStatusOptions} from '../services/labels'
import {availableActions} from '../services/orderActions'
import {isOrderScope,orderScopes,orderScopeQuery,orderListTitle} from '../services/navigation'
import type {Order,SharedRecord} from '../types'
export function useOrderList(){
 const route=useRoute(),router=useRouter(),mode=computed(()=>(route.query.mode||'pool') as ListMode)
 const rows=ref<Order[]>([]),projects=ref<SharedRecord[]>([]),loading=ref(false),error=ref(''),total=ref(0),page=ref(0)
 const status=ref(Number(route.query.status??-1)),keyword=ref(String(route.query.keyword||'')),warning=ref(String(route.query.warning||'soon')),reviewStatus=ref<number>(Number(route.query.reviewStatus??1)),reviewKind=ref<string|undefined>(typeof route.query.reviewKind==='string'?route.query.reviewKind:undefined)
 const title=computed(()=>orderListTitle(mode.value)),showScopes=computed(()=>isOrderScope(mode.value))
 const tabs=computed(()=>mode.value==='todo'?todoStatusOptions:statusOptions)
 const purpose=computed(()=>mode.value==='todo'&&status.value===9?'需要我审核的申请，包含延期、废弃、等级变更等':({pool:'权限范围内的全部工单',todo:'当前需要我接单、跟进、回访或审核的工单',related:'我登记、负责或参与过的工单',paid:'',review:'',warning:'',unfinished:''}[mode.value]||''))
 let sequence=0
 const load=async(more=false)=>{
  const own=++sequence;loading.value=true;error.value='';const next=more?page.value+1:0
  try{const query={...listQuery(mode.value,status.value,state.projectId,keyword.value,warning.value),pageIndex:next};if(typeof route.query.start==='string'&&typeof route.query.end==='string')query.terms!.push({column:'createTime',termType:'gte',value:new Date(route.query.start+'T00:00:00+08:00').getTime()},{column:'createTime',termType:'lt',value:new Date(route.query.end+'T00:00:00+08:00').getTime()+86400000});const result=mode.value==='review'?await api.reviewOrders(query,reviewStatus.value,reviewKind.value):await api.orders(query);if(own!==sequence)return;rows.value=more?[...rows.value,...result.data]:result.data;total.value=result.total;page.value=next}catch(e){if(own===sequence)error.value=errorText(e)}finally{if(own===sequence)loading.value=false}
 }
 const search=()=>{
  const query={...route.query,status:status.value,keyword:keyword.value||undefined,warning:warning.value,reviewStatus:reviewStatus.value,reviewKind:reviewKind.value||undefined}
  if(router.resolve({path:route.path,query}).fullPath===route.fullPath){void load();return}
  void router.replace({query})
 }
 const selectScope=(value:string|number)=>{
  if(!isOrderScope(value)||value===mode.value)return
  void router.push({path:'/orders',query:orderScopeQuery(route.query,value)})
 }
 const open=(o:Order)=>router.push('/orders/'+o.id)
 // 列表仅提供不依赖流程配置的快捷入口；动作页加载最新审核、权限和版本后再允许提交。
 const cardActions=(o:Order)=>{
  if(mode.value==='todo'&&status.value===9)return ['review']
  if(mode.value==='todo'&&status.value===8)return ['callback']
  return availableActions(o,[],[]).filter(a=>['dispatch','grab','accept','follow'].includes(a))
 }
 const perform=(o:Order,action:string)=>router.push(`/orders/${o.id}/action/${action}`)
 // 筛选以路由为准，刷新和浏览器回退恢复同一条件，再发起一次查询。
 watch(()=>route.query,()=>{
  status.value=Number(route.query.status??-1);keyword.value=String(route.query.keyword||'');warning.value=String(route.query.warning||'soon')
  reviewStatus.value=Number(route.query.reviewStatus??1);reviewKind.value=typeof route.query.reviewKind==='string'?route.query.reviewKind:undefined
  void load()
 })
 watch(()=>state.projectId,()=>void load())
 onMounted(async()=>{try{projects.value=(await api.projects()).data}catch(e){error.value=errorText(e)}await load()})
 return{mode,title,showScopes,scopes:orderScopes,selectScope,tabs,purpose,rows,projects,loading,error,total,status,keyword,warning,reviewStatus,reviewKind,search,load,open,cardActions,perform,state}
}
