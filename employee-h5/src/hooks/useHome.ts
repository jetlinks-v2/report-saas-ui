import {computed,onMounted,ref,watch} from 'vue'
import {useRouter} from 'vue-router'
import * as api from '../api/repair'
import {errorText} from '../api/http'
import {listQuery} from '../services/queries'
import {state} from '../services/session'
import type {SharedRecord} from '../types'
export function useHome(){
 const router=useRouter(),loading=ref(false),error=ref(''),projects=ref<SharedRecord[]>([])
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai'}).format(Date.now()),start=ref(today),end=ref(today)
 const metrics=ref<{total:number;completed:number;unfinished:number;paid:number;audit:number;warning:number;abandoned:number}>()
 const completionRate=computed(()=>{const m=metrics.value;return m&&m.total!==m.abandoned?(m.completed*100/(m.total-m.abandoned)).toFixed(1):'0.0'})
 let sequence=0
 const load=async()=>{
  const own=++sequence;loading.value=true;error.value=''
  try{
   if(start.value>end.value)throw Error('开始日期不能晚于结束日期')
   const terms=[...(state.projectId?[{column:'businessProjectId',value:state.projectId}]:[]),{column:'createTime',termType:'gte',value:new Date(start.value+'T00:00:00+08:00').getTime()},{column:'createTime',termType:'lt',value:new Date(end.value+'T00:00:00+08:00').getTime()+86400000}]
   const [rows,audit,warning]=await Promise.all([api.statistics({terms}),api.reviewOrders({terms,pageSize:1},1),api.count({...listQuery('warning',-1,state.projectId),terms:[...listQuery('warning',-1,state.projectId).terms||[],...terms]})])
   if(own!==sequence)return
   const sum=(key:string)=>rows.reduce((n,r)=>n+Number(r[key]||0),0)
   metrics.value={total:sum('total'),completed:sum('completed'),abandoned:sum('abandoned'),paid:sum('paidCount'),audit:audit.total,warning,unfinished:['noDistributed','waitAccept','waitFollow','handling','waitCallback','waitAudit'].reduce((n,key)=>n+sum(key),0)}
  }catch(e){if(own===sequence){metrics.value=undefined;error.value=errorText(e)}}finally{if(own===sequence)loading.value=false}
 }
 const go=(mode:string)=>router.push({path:'/orders',query:{mode,start:start.value,end:end.value}})
 watch(()=>state.projectId,()=>void load());onMounted(async()=>{try{projects.value=(await api.projects()).data}catch(e){error.value=errorText(e)}await load()})
 return{state,projects,metrics,completionRate,start,end,loading,error,load,go}
}
