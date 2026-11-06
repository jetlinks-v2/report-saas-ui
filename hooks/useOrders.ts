import i18n from '@jetlinks-web-core/locales'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, onBeforeUnmount, onDeactivated, reactive, ref, watch, nextTick } from 'vue'
import { buildQueryFilter, encodeConditionFilterQuery, type ConditionTerm, type ConditionExpressionNode } from '@jetlinks-web-core/components/ConditionFilter'
import { orderFilterFields, restoreOrderQuery } from '../services/reports'
import { categoryPath, categoryTree } from '../services/intake'
import { restoreCompletionForm, signedCompletion } from '../services/actions'
import { orderQuery, orderStatusTabs, statusCounts, printOrderSheet } from '../services/orderOutput'
import { useRepairIntake } from './useRepairIntake'
import { message } from 'ant-design-vue'
import * as api from '../api'
import type { ActionInput, Authorization, Configuration, Order, Process, Review, SharedRecord } from '../types'
import { actionNames, displayName, errorMessage, result } from '../utils'
const { t } = i18n.global
/** 工单处置状态与请求编排；状态迁移、权限和责任人资格始终由服务端判定。 */
export function useOrders() {
  const route=useRoute(),router=useRouter()
  const auditMode=computed(()=>route.path.endsWith('/newsstandAudit'))
  const reviewStatus=ref<number|undefined>(1),reviewKind=ref<string>()
  const rows=ref<Order[]>([]), total=ref(0), current=ref(1), loading=ref(false), saving=ref(false), error=ref('')
  const searchTerms=ref<ConditionTerm[]>([])
  const businessProjectId=ref<string>(), status=ref<number>(), authorization=ref<Authorization>()
  const counts=ref<Record<string,number>>()
  const exportOpen=ref(false),exportScope=ref<'all'|'current'>('all'),exporting=ref(false),exportError=ref('')
  const printOpen=ref(false),printElement=ref<HTMLElement>()
  const projects=ref<SharedRecord[]>([]), people=ref<SharedRecord[]>([]), configurations=ref<Configuration[]>([])
  const reviews=ref<Review[]>([])
  const detailOpen=ref(false), actionOpen=ref(false), selected=ref<Order>(), history=ref<Process[]>([]), action=ref('')
  const actionFormRef=ref<{validate:()=>Promise<void>;clearValidate:()=>void}>()
  const actionForm=reactive<ActionInput>({description:'',rework:false})
  const options=(items:SharedRecord[])=>items.map(x=>({value:x.id,label:displayName(x)}))
  const projectOptions=computed(()=>options(projects.value)), personOptions=computed(()=>options(people.value))
  const peopleLoading=ref(false),peopleError=ref('')
  let peopleSearchTimer:ReturnType<typeof setTimeout>|undefined,peopleRevision=0
  const actionUploading=ref(false), optionsLoading=ref(false),optionsError=ref(false)
  let navigationRevision=0,detailRevision=0,actionRevision=0,summaryRevision=0
  const initialPath=route.path
  const activePage=()=>route.path===initialPath||(route.path.endsWith('/newsstandAudit')||route.path.endsWith('/reportedThatRecords'))
  let summaryKey=''
  const completionReadOnly=computed(()=>action.value==='finish'&&!!selected.value&&!!signedCompletion(selected.value,history.value,reviews.value))
  const completionTypes=computed(()=>[{value:'finish',label:t('ReportRepair.normalClosure')},...(can('close')&&!selected.value?.paid?[{value:'close',label:t('ReportRepair.abnormalClosure')}]:[])])
  const actionCategoryTree=computed(()=>categoryTree(configurations.value))
  const actionCategoryPath=computed(()=>categoryPath(configurations.value,actionForm.categoryId))
  const categoryOptions=computed(()=>configurations.value.filter(row=>row.kind==='category'&&categoryPath(configurations.value,row.id).length===3).map(row=>({value:row.id!,label:row.name})))
  const labelOptions=computed(()=>configurations.value.filter(row=>row.kind==='label'&&row.parentId===actionForm.categoryId).map(row=>({value:row.id!,label:row.name})))
  const configOptions=(kind:string)=>configurations.value.filter(x=>x.kind===kind&&x.businessProjectId===selected.value?.businessProjectId).map(x=>({value:x.id!,label:x.name}))
  const satisfactions=computed(()=>configurations.value.filter(row=>row.kind==='satisfaction'&&row.businessProjectId===selected.value?.businessProjectId).sort((a,b)=>(a.configuration.score||0)-(b.configuration.score||0)))
  const evaluationLabelOptions=computed(()=>configurations.value.filter(row=>row.kind==='evaluationLabel'&&row.configuration.satisfactionId===actionForm.satisfactionId).map(row=>({value:row.id!,label:row.name})))
  const replyOptions=computed(()=>configurations.value.filter(row=>row.kind==='reply'&&row.configuration.staticNode===({follow:5,finish:1,quote:1,close:7} as Record<string,number>)[action.value]).map(row=>({value:row.id!,label:row.configuration.content||row.name})))
  watch(()=>actionForm.categoryId,()=>{actionForm.labelIds=[]})
  watch(()=>actionForm.satisfactionId,id=>{actionForm.satisfaction=satisfactions.value.find(row=>row.id===id)?.configuration.score;actionForm.evaluationLabelIds=[]})
  const can=(name:string)=>!!authorization.value?.permissions.find(p=>p.id==='repair-order')?.actions.includes(name)
  const canPrint=computed(()=>!!selected.value&&[0,1,2,3,5,6,7,8].includes(selected.value.status)&&can('evaluate'))
  let disposePrint:(()=>void)|undefined
  const startPrint=()=>{if(canPrint.value)printOpen.value=true}
  const printSelected=()=>{
    if(!canPrint.value||!printElement.value||!selected.value)return
    disposePrint?.();disposePrint=printOrderSheet(printElement.value,selected.value.number)
  }
  onBeforeUnmount(()=>{disposePrint?.();resetTransient()})
  const startExport=()=>{if(can('export')){exportScope.value='all';exportError.value='';exportOpen.value=true}}
  const exportOrders=async()=>{
    if(!can('export')||exporting.value)return
    exporting.value=true;exportError.value=''
    try{
      const query=exportScope.value==='all'?orderQuery([]):orderQuery(buildQueryFilter(searchTerms.value,filterFields.value).terms,businessProjectId.value,status.value)
      const task=result(await api.createExport(query,auditMode.value?{
        type:'review',...(exportScope.value==='current'?{reviewStatus:reviewStatus.value,reviewKind:reviewKind.value}:{})
      }:{}));exportOpen.value=false
      message.success(t('ReportRepair.exportedDownloadTheFileFromExports', { p0: task.rowCount, p1: auditMode.value?t('ReportRepair.reviewRecords'):t('ReportRepair.orders') }))
    }catch(e){exportError.value=errorMessage(e)}finally{exporting.value=false}
  }
  const availableActions=computed(()=>{
    const order=selected.value;if(!order)return []
    const own=order.assignedUserId===authorization.value?.user.id
    const pending=reviews.value.filter(row=>row.status===1), locked=pending.some(row=>row.kind==='abandon')
    const choices=[order.status===0&&'dispatch',order.status===0&&'grab',order.status===6&&(own||(!order.assignedUserId&&!!order.candidateRoleId))&&'accept',
      [7,1].includes(order.status)&&own&&'follow',order.status===1&&own&&!pending.length&&(!order.paid||order.signed)&&'finish',
      order.status===1&&own&&!order.paid&&'toPaid',order.status===1&&own&&order.paid&&!order.signatureRequested&&'quote',
      order.status===1&&order.signatureRequested&&!order.signed&&'sign',
      [8,2].includes(order.status)&&'callback',[6,7,1].includes(order.status)&&!pending.length&&'transfer',
      order.status===1&&own&&'delay',order.status===1&&own&&!pending.length&&'close',
      order.status===1&&own&&'changeLevel',[0,1,6,7].includes(order.status)&&!pending.length&&'abandonApply',
      [0,1,6,7].includes(order.status)&&!pending.length&&'changeCategory',
      [2,8,5].includes(order.status)&&!order.staffEvaluated&&'evaluate',[2,8,5].includes(order.status)&&!order.ownerEvaluated&&'ownerEvaluate',![2,3,4,5].includes(order.status)&&'urge',pending.length>0&&'review']
    return choices.filter((name):name is string=>typeof name==='string'&&can(name)&&(!locked||name==='review'))
  })
  let queryRevision=0
  const load=async(refreshCounts=false)=>{
    if(refreshCounts)summaryKey=''
    const own=++queryRevision
    loading.value=true;error.value=''
    try {
      const query={...orderQuery(buildQueryFilter(searchTerms.value,filterFields.value).terms,businessProjectId.value,status.value),pageIndex:current.value-1,pageSize:20}
      // 列表完成即可展示；状态数量独立加载，分页复用同一筛选的结果。
      const countQuery=orderQuery(buildQueryFilter(searchTerms.value,filterFields.value).terms,businessProjectId.value)
      const key=JSON.stringify(countQuery)
      if(auditMode.value){summaryRevision++;counts.value=undefined;summaryKey=''}
      else if(summaryKey!==key){
        summaryKey=key;counts.value=undefined
        const revision=++summaryRevision
        void api.queryStatusCounts(countQuery).then(summary=>{
          if(revision===summaryRevision)counts.value=statusCounts(result(summary))
        }).catch(e=>{if(revision===summaryRevision){summaryKey='';message.warning(errorMessage(e))}})
      }
      const response=await (auditMode.value?api.queryReviewOrders(query,reviewStatus.value,reviewKind.value):api.queryOrders(query))
      if(own===queryRevision){const page=result(response);rows.value=page.data;total.value=page.total}
    }
    catch(e){if(own===queryRevision){error.value=errorMessage(e);counts.value=undefined}}finally{if(own===queryRevision)loading.value=false}
  }
  const loadOptions=async()=>{
    const query={pageSize:200}
    const [org,auth]=await Promise.all([api.queryProjects(),api.getAuthorization()])
    projects.value=result(org);authorization.value=result(auth)
  }
  const routeFields=computed(()=>orderFilterFields(projectOptions.value))
  const filterFields=routeFields
  const encodedQuery=()=>encodeConditionFilterQuery([
    ...(searchTerms.value.length?[{terms:searchTerms.value as ConditionExpressionNode[]}]:[]),
    ...(businessProjectId.value?[{column:'businessProjectId',termType:'eq',value:businessProjectId.value}]:[]),
    ...(status.value!==undefined?[{column:'status',termType:'eq',value:status.value}]:[]),
  ],routeFields.value)
  const restoreQuery=()=>{
    const restored=restoreOrderQuery(route.query.q,routeFields.value)
    // 外层 AND 分组只用于与快捷项目/状态相交，编辑器中直接展示原条件。
    searchTerms.value=restored.terms.length===1&&restored.terms[0].terms?restored.terms[0].terms:restored.terms
    businessProjectId.value=restored.businessProjectId;status.value=restored.status
  }
  const search=()=>{if(!ready||(encodedQuery()||undefined)===route.query.q)return;filter()}
  const pageChange=(page:{current?:number})=>{current.value=page.current||1;void load()}
  const filter=()=>{
    current.value=1
    const q=encodedQuery()||undefined
    if(q!==route.query.q)void router.replace({query:{...route.query,q}})
    void load()
  }
  const changeStatusTab=(value:string)=>{status.value=value==='all'?undefined:Number(value);filter()}
  const showDetail=async(order:Order)=>{
    const revision=++detailRevision,navigation=navigationRevision
    loading.value=true;error.value=''
    try{const [detail,process,review]=await Promise.all([api.getOrder(order.id),api.getOrderHistory(order.id),api.getReviews(order.id)]);if(revision!==detailRevision||navigation!==navigationRevision)return;selected.value=result(detail);history.value=result(process);reviews.value=result(review);detailOpen.value=true}
    catch(e){if(revision===detailRevision&&navigation===navigationRevision)error.value=errorMessage(e)}finally{if(revision===detailRevision)loading.value=false}
  }
  const intake=reactive(useRepairIntake(error,async order=>{summaryKey='';if(activePage()){void load();await showDetail(order)}}))
  const startCreate=()=>intake.start(businessProjectId.value)
  // 选项目后只请求该项目配置；切换时立即清空旧选项和已选值。
  let configurationRequest = 0
  const loadConfigurations=async(projectId?:string)=>{
    const sequence=++configurationRequest
    configurations.value=[]
    if(!projectId)return
    const page=result(await api.queryConfigurations({paging:false,terms:[{column:'enabled',value:true},{column:'businessProjectId',value:projectId}]}))
    if(sequence===configurationRequest)configurations.value=page.data
  }
  const searchAssignees=(text:string,immediate=false)=>{
    clearTimeout(peopleSearchTimer)
    const revision=++peopleRevision,actionRequest=actionRevision,order=selected.value,name=action.value
    if(!order)return
    peopleLoading.value=true;peopleError.value=''
    people.value=people.value.filter(person=>person.id===actionForm.assignedUserId)
    peopleSearchTimer=setTimeout(async()=>{
      try{
        const candidates=result(await api.getAssignees(order.id,name,text.trim(),text.trim()?20:5))
        if(revision!==peopleRevision||actionRequest!==actionRevision)return
        const chosen=people.value.find(person=>person.id===actionForm.assignedUserId)
        people.value=candidates.filter(person=>name!=='transfer'||person.id!==order.assignedUserId)
        if(chosen&&!people.value.some(person=>person.id===chosen.id))people.value.unshift(chosen)
      }catch(e){if(revision===peopleRevision&&actionRequest===actionRevision)peopleError.value=errorMessage(e)}
      finally{if(revision===peopleRevision)peopleLoading.value=false}
    },immediate?0:300)
  }
  const requestId=ref('')
  const startAction=async(name:string)=>{
    if(!selected.value||saving.value)return
    const revision=++actionRevision,navigation=navigationRevision,order=selected.value
    peopleRevision++;clearTimeout(peopleSearchTimer);peopleLoading.value=false
    action.value=name;error.value='';optionsError.value=false;people.value=[]
    Object.assign(actionForm,{assignedUserId:undefined,description:'',levelId:undefined,rework:false,photoId:undefined,attachmentIds:[],reason:'',reply:'',delayUntil:undefined,reviewId:undefined,approved:true,satisfaction:undefined,satisfactionId:undefined,satisfactionName:undefined,evaluationLabelNames:[],replyId:undefined,evaluationLabelIds:[],callbackMethod:name==='callback'?'电话':undefined,callbackResult:name==='callback'?'有效':undefined,callbackTime:name==='callback'?Date.now():undefined,callbackPerson:name==='callback'?(authorization.value?.user.name||authorization.value?.user.username):undefined,categoryId:undefined,labelIds:[],materialAmount:undefined,artificialAmount:undefined,signatureFileId:undefined,ownerName:undefined,ownerPhone:undefined})
    requestId.value=crypto.randomUUID();actionUploading.value=false;optionsLoading.value=true;actionOpen.value=true
    try{
      if(['follow','finish','quote','changeLevel','changeCategory','evaluate','ownerEvaluate','callback','close'].includes(name))await loadConfigurations(selected.value.businessProjectId)
      if(revision!==actionRevision||navigation!==navigationRevision)return
      if(name==='review')actionForm.reviewId=reviews.value.find(row=>row.status===1)?.id
      if(['follow','finish','quote','close'].includes(name))actionForm.replyId=replyOptions.value[0]?.value
      if(name==='finish'){
        actionForm.materialAmount=selected.value.materialAmount
        actionForm.artificialAmount=selected.value.artificialAmount
        const quote=signedCompletion(selected.value,history.value,reviews.value)
        if(quote)restoreCompletionForm(actionForm,selected.value,quote)
      }
      actionOpen.value=true
      if(['dispatch','transfer'].includes(name))searchAssignees('',true)
      await nextTick();actionFormRef.value?.clearValidate()
    }catch(e){if(revision===actionRevision&&navigation===navigationRevision){optionsError.value=true;error.value=errorMessage(e)}}finally{if(revision===actionRevision)optionsLoading.value=false}
  }
  const submitAction=async()=>{
    if(!selected.value||optionsLoading.value||saving.value||optionsError.value)return
    const navigation=navigationRevision,name=action.value
    if(actionUploading.value){message.warning(t('ReportRepair.waitForAttachmentsToFinishUploading'));return}
    try{await actionFormRef.value?.validate()}catch{return}
    saving.value=true;error.value=''
    try{const order=result(await api.actOnOrder(selected.value,action.value,actionForm,requestId.value));summaryKey='';if(navigation===navigationRevision){actionOpen.value=false;void load();await showDetail(order)};message.success(t('ReportRepair.succeeded', { p0: actionNames[name] }))}
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  const changeCompletionType=async(name:string)=>{
    if(!['finish','close'].includes(name)||completionReadOnly.value||(name==='close'&&!can('close')))return
    action.value=name;actionForm.replyId=replyOptions.value[0]?.value
    await nextTick();actionFormRef.value?.clearValidate()
  }
  let ready=false
  const resetTransient=()=>{
    peopleRevision++;clearTimeout(peopleSearchTimer);peopleLoading.value=false
    navigationRevision++;detailRevision++;actionRevision++;configurationRequest++;queryRevision++;summaryRevision++
    intake.open=false;detailOpen.value=false;actionOpen.value=false;exportOpen.value=false;printOpen.value=false
    optionsLoading.value=false;loading.value=false;actionUploading.value=false;error.value='';summaryKey=''
    disposePrint?.()
  }
  watch(()=>route.path,()=>{resetTransient();if(ready&&activePage()){restoreQuery();current.value=1;void load()}})
  watch(()=>route.query.q,()=>{if(ready&&activePage()&&encodedQuery()!==(route.query.q||'')){restoreQuery();current.value=1;void load()}})
  watch(actionOpen,open=>{if(!open){actionRevision++;configurationRequest++;optionsLoading.value=false;peopleRevision++;clearTimeout(peopleSearchTimer);peopleLoading.value=false}})
  onDeactivated(resetTransient)
  onMounted(async()=>{try{await loadOptions();restoreQuery();ready=true;await load()}catch(e){error.value=errorMessage(e)}})
  return {peopleError,peopleLoading,searchAssignees,optionsError,optionsLoading,counts,orderStatusTabs,changeStatusTab,exportOpen,exportScope,exporting,exportError,startExport,exportOrders,canPrint,printOpen,printElement,startPrint,printSelected,searchTerms,actionFormRef,completionReadOnly,completionTypes,actionCategoryTree,actionCategoryPath,changeCompletionType,auditMode,reviewStatus,reviewKind,satisfactions,evaluationLabelOptions,replyOptions,filterFields,search,actionUploading,categoryOptions,labelOptions,intake,rows,total,current,loading,saving,error,businessProjectId,status,projectOptions,personOptions,configOptions,can,availableActions,detailOpen,actionOpen,selected,history,reviews,configurations,action,actionForm,load,pageChange,filter,startCreate,showDetail,startAction,submitAction}
}
