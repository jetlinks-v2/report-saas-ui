import i18n from '@jetlinks-web-core/locales'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildQueryFilter, encodeConditionFilterQuery, decodeConditionFilterQuery, type ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'
import { message } from 'ant-design-vue'
import { createExport, queryOrders, queryProjects, queryStatistics } from '../api'
import type { ExportType, Order, Query, ReportRow, SelectOption } from '../types'
import { displayName, errorMessage, result } from '../utils'
import { reportColumns, reportFields, reportPages, orderFilterFields, canDrillReport, reportOrderQuery } from '../services/reports'
import { useRepairPermissions } from './useRepairPermissions'
const { t } = i18n.global

/** 报表保留旧菜单的不同口径，页面只共享筛选和加载编排。 */
export function useReports(){
 const route=useRoute(),router=useRouter(), loading=ref(false), exporting=ref(false),error=ref('')
 const page=computed(()=>reportPages[route.path.split('/').pop()||'']||reportPages.index)
 const rows=ref<ReportRow[]>([]),orders=ref<Order[]>([]),projects=ref<SelectOption[]>([]),terms=ref<ConditionTerm[]>([])
 const total=ref(0),current=ref(1)
 const exportOpen=ref(false),exportScope=ref<'all'|'current'>('all')
 const fields=computed(()=>reportFields(projects.value)),columns=computed(()=>reportColumns(page.value.mode))
 const {can,loadPermissions}=useRepairPermissions()
 const canExport=computed(()=>can('repair-order','export'))
 const canDrill=(key:string)=>can('repair-order','query')&&canDrillReport(page.value.mode,key)
 const drill=(row:ReportRow,key:string)=>{
  if(!canDrill(key))return
  void router.push({path:'/businessProcessing/reportedThatRecords',query:{...route.query,q:reportOrderQuery(row,key,terms.value||[],orderFilterFields(projects.value))}})
 }
 const query=(all=false):Query=>({terms:[{terms:all?[]:buildQueryFilter(terms.value,fields.value).terms},...(page.value.mode==='paid'?[{column:'paid',value:true}]:[])],sorts:[{name:'createTime',order:'desc'},{name:'id',order:'asc'}]})
 let revision=0
 const load=async()=>{const own=++revision;loading.value=true;error.value='';try{
  if(page.value.mode==='evaluation'){
   const response=result(await queryOrders({...query(),pageIndex:current.value-1,pageSize:20}));if(own===revision){orders.value=response.data;total.value=response.total}
  }else{const response=result(await queryStatistics(query()));if(own===revision)rows.value=response}
 }catch(e){if(own===revision)error.value=errorMessage(e)}finally{if(own===revision)loading.value=false}}
 const search=()=>{if(!ready)return;const q=encodeConditionFilterQuery(terms.value,fields.value)||undefined;if(q===route.query.q)return;current.value=1;void router.replace({query:{...route.query,q}});void load()}
 const pageChange=(pager:{current?:number})=>{current.value=pager.current||1;void load()}
 const startExport=()=>{exportScope.value='all';exportOpen.value=true}
 const exportData=async()=>{if(exporting.value||!canExport.value)return;exporting.value=true;error.value='';try{
  const task=result(await createExport(query(exportScope.value==='all'),{type:page.value.mode as ExportType}));exportOpen.value=false
  message.success(t('ReportRepair.exportedRowsOfDownloadTheFileFromExports', { p0: task.rowCount, p1: page.value.title }))
 }catch(e){error.value=errorMessage(e)}finally{exporting.value=false}}
 let ready=false
 watch(()=>[route.path,route.query.q],([path,q],[oldPath])=>{if(ready&&(path!==oldPath||encodeConditionFilterQuery(terms.value,fields.value)!==(q||''))){terms.value=decodeConditionFilterQuery(q,fields.value);current.value=1;rows.value=[];orders.value=[];void load()}})
 onMounted(async()=>{try{await loadPermissions();projects.value=result(await queryProjects()).map(row=>({value:row.id,label:displayName(row)}));terms.value=decodeConditionFilterQuery(route.query.q,fields.value);ready=true;await load()}catch(e){error.value=errorMessage(e)}})
 return {terms,page,columns,fields,rows,orders,total,current,loading,exporting,error,canExport,canDrill,drill,load,search,pageChange,exportData,exportOpen,exportScope,startExport}
}
