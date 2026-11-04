import i18n from '@jetlinks-web-core/locales'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildQueryFilter, decodeConditionFilterQuery, encodeConditionFilterQuery, type ConditionFilterField, type ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'
import { queryOperationLogs } from '../api'
import type { OperationLog } from '../types'
import { errorMessage, result } from '../utils'
const { t } = i18n.global

/** 条件沿用通用q编码；接口始终由服务端限定当前应用及租户。 */
export function useOperationLogs() {
  const route=useRoute(),router=useRouter()
  const fields:ConditionFilterField[]=[
    {title:t('ReportRepair.logStatus'),dataIndex:'status',search:{type:'select',options:[{value:0,label:t('ReportRepair.normal')},{value:1,label:t('ReportRepair.error')}]}},
    ...[['operatorName',t('ReportRepair.operator')],['operatorId',t('ReportRepair.operatorID')],['operation',t('ReportRepair.operation')],['action',t('ReportRepair.operationType')],['url',t('ReportRepair.requestEndpoint')]].map(([dataIndex,title])=>({title,dataIndex,search:{type:'string'}})),
    {title:t('ReportRepair.operationTime'),dataIndex:'createTime',search:{type:'date'}},
  ]
  const terms=ref<ConditionTerm[]>(decodeConditionFilterQuery(route.query.q,fields))
  const rows=ref<OperationLog[]>([]),total=ref(0),current=ref(1),loading=ref(false),error=ref('')
  let revision=0
  const load=async()=>{
    const request=++revision;loading.value=true;error.value=''
    try{
      const page=result(await queryOperationLogs({terms:buildQueryFilter(terms.value,fields).terms,pageIndex:current.value-1,pageSize:20}))
      if(request===revision){rows.value=page.data;total.value=page.total}
    }catch(e){if(request===revision)error.value=errorMessage(e)}finally{if(request===revision)loading.value=false}
  }
  const search=()=>{
    const q=encodeConditionFilterQuery(terms.value,fields)||undefined
    if(q!==route.query.q)void router.replace({query:{...route.query,q}})
  }
  watch(()=>route.query.q,()=>{terms.value=decodeConditionFilterQuery(route.query.q,fields);current.value=1;void load()})
  const pageChange=(page:{current?:number})=>{current.value=page.current||1;void load()}
  onMounted(load)
  return {fields,terms,rows,total,current,loading,error,load,search,pageChange}
}
