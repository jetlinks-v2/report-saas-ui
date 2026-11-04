import i18n from '@jetlinks-web-core/locales'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildQueryFilter, decodeConditionFilterQuery, encodeConditionFilterQuery, type ConditionFilterField, type ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'
import { downloadExport, queryExports } from '../api'
import type { ExportTask } from '../types'
import { errorMessage, result } from '../utils'
import { useRepairPermissions } from './useRepairPermissions'
const { t } = i18n.global
/** 下载复用当前应用的认证请求，不把令牌放入URL。 */
export function useExports(){
 const route=useRoute(),router=useRouter()
 const fields:ConditionFilterField[]=[
  {title:t('ReportRepair.fileName'),dataIndex:'name',search:{type:'string'}},
  {title:t('ReportRepair.exportedBy'),dataIndex:'creatorName',search:{type:'string'}},
  {title:t('ReportRepair.created'),dataIndex:'createTime',search:{type:'date'}},
  {title:t('ReportRepair.status'),dataIndex:'status',search:{type:'select',options:[{value:'processing',label:t('ReportRepair.exporting')},{value:'completed',label:t('ReportRepair.exported')},{value:'failed',label:t('ReportRepair.exportFailed')}]}},
 ]
 const terms=ref<ConditionTerm[]>(decodeConditionFilterQuery(route.query.q,fields))
 const {can,loadPermissions}=useRepairPermissions(),canDownload=computed(()=>can('repair-order','export'))
 const rows=ref<ExportTask[]>([]),total=ref(0),current=ref(1),loading=ref(false),error=ref(''),downloading=ref('')
 let revision=0
 const load=async()=>{const own=++revision;loading.value=true;error.value='';try{const page=result(await queryExports({terms:buildQueryFilter(terms.value,fields).terms,pageIndex:current.value-1,pageSize:20,sorts:[{name:'createTime',order:'desc'},{name:'id',order:'asc'}]}));if(own===revision){rows.value=page.data;total.value=page.total}}catch(e){if(own===revision)error.value=errorMessage(e)}finally{if(own===revision)loading.value=false}}
 const search=()=>{const q=encodeConditionFilterQuery(terms.value,fields)||undefined;if(q!==route.query.q)void router.replace({query:{...route.query,q}})}
 watch(()=>route.query.q,()=>{terms.value=decodeConditionFilterQuery(route.query.q,fields);current.value=1;void load()})
 const pageChange=(page:{current?:number})=>{current.value=page.current||1;void load()}
 const download=async(task:ExportTask)=>{if(!canDownload.value||task.status!=='completed'||downloading.value)return;downloading.value=task.id;error.value='';try{
  const response=await downloadExport(task.id)
  const blob=response instanceof Blob?response:response.data
  if(!(blob instanceof Blob))throw Error(t('ReportRepair.downloadFailed'))
  if(blob.type.includes('json')){const failure=JSON.parse(await blob.text());throw Error(failure.message||t('ReportRepair.downloadFailed'))}
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=task.name;anchor.click();URL.revokeObjectURL(url)
 }catch(e){error.value=errorMessage(e)}finally{downloading.value=''}}
 onMounted(async()=>{try{await loadPermissions();await load()}catch(e){error.value=errorMessage(e)}})
 return {fields,terms,search,canDownload,rows,total,current,loading,error,downloading,load,pageChange,download}
}
