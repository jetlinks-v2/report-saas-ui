import i18n from '@jetlinks-web-core/locales'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useBusinessApplicationStore } from '@jetlinks-web-core/store'
import { configurationPages, configurationNameLabel, initialConfiguration, initialFlowConfiguration } from '../services/configuration'
import { categoryPath } from '../services/intake'
import { useRoute, useRouter } from 'vue-router'
import { buildQueryFilter, decodeConditionFilterQuery, encodeConditionFilterQuery, type ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'
import { flowCategoryTree, flowConfigured, flowDraft, flowFilterFields, flowFilterTerms, flowRoleName, flowRoleNames } from '../services/configurationFlow'
import { message, type FormInstance } from 'ant-design-vue'
import { queryConfigurations, queryProjects, saveConfiguration, deleteConfiguration, deleteFlowConfiguration, moveFlowConfiguration, queryApplicationRoles } from '../api'
import type { Configuration, SharedRecord, SelectOption } from '../types'
import { displayName, errorMessage, result } from '../utils'
import { configurationFilterFields, configurationFilterTerms, configurationTree, configurationParentTree } from '../services/configurationSearch'
import { useDescriptionConfiguration } from './useDescriptionConfiguration'
import { useRepairFormOptions } from './useRepairFormOptions'
import { useQrConfiguration } from './useQrConfiguration'
import { useRepairPermissions } from './useRepairPermissions'
const { t } = i18n.global
/** 配置按业务项目独立维护，编辑不允许把既有配置移动到另一业务项目。 */
export function useConfiguration() {
  const { loadPermissions, can } = useRepairPermissions()
  const canSave = computed(() => can('repair-configuration', 'save'))
  const route = useRoute(), router=useRouter()
  const activeTab=ref('configuration'),filterTerms=ref<ConditionTerm[]>([])
  const filterFields=computed(()=>isFlow.value?flowFilterFields(related.value):configurationFilterFields(kind.value,related.value))
  const roleName=(row:Configuration,key:Parameters<typeof flowRoleName>[1])=>flowRoleName(row,key,roleOptions.value)
  const page = computed(() => configurationPages[route.path.split('/').pop() || ''] || {kind:'channel',title:t('ReportRepair.reportingChannelConfiguration')})
  const kind = computed(() => page.value.kind)
  const isFlow = computed(() => route.path.split('/').pop() === 'theBusinessProcess')
  const flowEditing = ref(false), flowSourceId=ref<string>(), flowSourceModifyTime=ref<number>()
  const configurationFormRef=ref<FormInstance>()
  const flowEnabled = (row:Configuration) => row.configuration.flowEnabled !== false
  const flowCategories = computed(() => related.value.filter(row => row.kind === 'category'))
  const flowCategoryOptions = computed(() => flowCategoryTree(flowCategories.value.filter(row=>row.businessProjectId===form.businessProjectId),flowSourceId.value))
  const title = computed(() => page.value.title)
  const nameLabel=computed(()=>configurationNameLabel(kind.value))
  const actualKind = kind
  const descriptions=useDescriptionConfiguration()
  const related = ref<Configuration[]>([]), roleOptions = ref<SelectOption[]>([])
  const parentOptions = computed(() => related.value.filter(row => row.id !== form.id && row.businessProjectId === form.businessProjectId &&
    (actualKind.value === 'description' ? row.kind === 'label' : row.kind === 'category' &&
      (actualKind.value === 'label' || categoryPath(related.value,row.id).length < 3)))
    .map(row => ({value:row.id!,label:row.name})))
  const parentTree=computed(()=>configurationParentTree(related.value,form))
  const satisfactionOptions = computed(() => {
    const options=related.value.filter(row=>row.kind==='satisfaction'&&row.businessProjectId===form.businessProjectId&&(row.enabled||row.id===form.configuration.satisfactionId))
      .sort((a,b)=>(a.configuration.score||0)-(b.configuration.score||0)).map(row=>({value:row.id!,label:t('ReportRepair.ratingStatusLabel', { p0: row.name, p1: row.configuration.score, p2: row.enabled?'':t('ReportRepair.disabledSuffix') })}))
    const original=form.configuration.satisfactionId
    if(form.id&&original&&!options.some(row=>row.value===original))options.push({value:original,label:t('ReportRepair.theOriginalRatingWasDeletedOrIsInaccessible')})
    return options
  })
  const leafCategory=computed(()=>actualKind.value==='category'&&!!form.parentId&&categoryPath(related.value,form.parentId).length===2)
  const parentName = (id?:string) => related.value.find(row=>row.id===id)?.name || '—'
  const rows = ref<Configuration[]>([]), projects = ref<SharedRecord[]>([])
  const businessProjectId = ref<string>()
  const projectOptions = computed(() => projects.value.map(row => ({ value: row.id, label: displayName(row) })))
  const projectName = (id: string) => projectOptions.value.find(option => option.value === id)?.label || t('ReportRepair.projectInaccessible')
  const loading = ref(false), saving = ref(false), error = ref(''), open = ref(false)
  const total = ref(0), current = ref(1)
  const form = reactive<Configuration>({ businessProjectId: '', kind: 'channel', name: '', enabled: true, configuration: {} })
  const qr=useQrConfiguration(form,related)
  const formSettings=useRepairFormOptions()
  let sequence=0
  const load = async () => {
    const request=++sequence
    loading.value = true; error.value = ''
    try {
      const terms: object[] = [{ column: 'kind', value: actualKind.value }]
      if (businessProjectId.value) terms.push({ column: 'businessProjectId', value: businessProjectId.value })
      const all = result(await queryConfigurations({paging:false}))
      if(request!==sequence)return
      related.value=all.data
      // 原流程列表显示各层级已配置的分类；按工单实际分类匹配，不继承父级流程。
      if(isFlow.value) {
        const ids=flowCategories.value.filter(row=>flowConfigured(row.configuration)).map(row=>row.id)
        if(!ids.length){rows.value=[];total.value=0;return}
        terms.push({column:'id',termType:'in',value:ids})
      }
      if(filterTerms.value.length){const query=buildQueryFilter(filterTerms.value,filterFields.value).terms;terms.push({terms:isFlow.value?flowFilterTerms(query,related.value):configurationFilterTerms(query,related.value)})}
      const response=await queryConfigurations({...(isFlow.value?{paging:false}:{}),pageIndex:current.value-1,pageSize:20,terms,sorts:isFlow.value?[{name:'flowModifyTime',order:'desc'},{name:'modifyTime',order:'desc'},{name:'id',order:'desc'}]:[{name:'sortIndex',order:'asc'},{name:'createTime',order:'desc'},{name:'id',order:'asc'}]})
      if(request!==sequence)return
      const page = result(response)
      if(isFlow.value){
        // 列表已经读取完整配置作为分类选项；历史合并记录与新流程按同一有效更新时间排序。
        const ordered=page.data.sort((a,b)=>(b.flowModifyTime??b.modifyTime??0)-(a.flowModifyTime??a.modifyTime??0)||(b.id||'').localeCompare(a.id||''))
        rows.value=ordered.slice((current.value-1)*20,current.value*20);total.value=ordered.length
      }else{rows.value=page.data;total.value=page.total}
    } catch (e) { if(request===sequence)error.value = errorMessage(e) } finally { if(request===sequence)loading.value = false }
  }
  const selectFlowCategory = (id:string) => {
    const row=related.value.find(item=>item.id===id)
    if(row){
      const draft=flowDraft(form.configuration)
      Object.assign(form,JSON.parse(JSON.stringify(row)),{configuration:{...row.configuration,...draft}})
    }
  }
  const edit = (row?: Configuration) => {
    flowEditing.value=!!row;flowSourceId.value=isFlow.value?row?.id:undefined;flowSourceModifyTime.value=row?.modifyTime;error.value=''
    Object.assign(form, { id: undefined, parentId: undefined, sortIndex: actualKind.value==='category'?undefined:0, businessProjectId: businessProjectId.value || '', kind: actualKind.value, name: '', enabled: ['label','satisfaction'].includes(actualKind.value)?undefined:true,
      configuration: initialConfiguration(actualKind.value) }, row ? JSON.parse(JSON.stringify(row)) : {})
    if(['description','reply'].includes(actualKind.value))form.configuration.content ??= row?.name||''
    if(actualKind.value==='commission'&&!form.businessProjectId)form.businessProjectId=projectOptions.value[0]?.value||''
    if(isFlow.value){
      if(!row)form.configuration={...initialFlowConfiguration(),
        closeRoleId:roleOptions.value.find(role=>role.label===t('ReportRepair.abnormalClosureReviewer'))?.value,
        delayRoleId:roleOptions.value.find(role=>role.label===t('ReportRepair.extensionReviewer'))?.value}
      form.configuration.flowEnabled ??= true
    }
    open.value = true
    void nextTick(() => configurationFormRef.value?.clearValidate())
  }
  const save = async () => {
    if(['reply','description'].includes(actualKind.value))form.name=(form.configuration.content||'').slice(0,128)
    if(actualKind.value==='commission')form.name=projectName(form.businessProjectId)
    try{await configurationFormRef.value?.validate()}catch{return}
    if(isFlow.value) {
      if(!form.id){message.warning(t('ReportRepair.selectAnIssueCategoryWithoutAWorkflow'));return}
      form.configuration.flowRoleNames=flowRoleNames(form,roleOptions.value)
      form.configuration.flowConfigured=true
      form.configuration.flowEnabled ??= true
    }
    if (!form.businessProjectId || !form.name.trim()) { message.warning(t('ReportRepair.selectAProjectAndEnterAName')); return }
    saving.value = true; error.value = ''
    try { result(await (isFlow.value&&flowSourceId.value&&form.id!==flowSourceId.value
      ?moveFlowConfiguration(flowSourceId.value,form.id!,{sourceModifyTime:flowSourceModifyTime.value!,configuration:form.configuration})
      :saveConfiguration(form))); open.value = false; await load(); message.success(t('ReportRepair.saved')) }
    catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
  }
  const search=()=>{const q=encodeConditionFilterQuery(filterTerms.value,filterFields.value)||undefined;if(q!==route.query.q)void router.replace({query:{...route.query,q}})}
  watch(()=>route.query.q,()=>{filterTerms.value=decodeConditionFilterQuery(route.query.q,filterFields.value);current.value=1;void load()})
  const pageChange = (page: { current?: number }) => { current.value = page.current || 1; void load() }
  watch([actualKind, businessProjectId, isFlow], () => { current.value = 1; void load() })
  watch(kind,()=>{descriptions.close();filterTerms.value=decodeConditionFilterQuery(route.query.q,filterFields.value)})
  const toggle = async (row:Configuration) => {
    saving.value=true;error.value=''
    try {
      const input=isFlow.value?{...row,configuration:{...row.configuration,flowEnabled:!flowEnabled(row)}}:{...row,enabled:!row.enabled}
      result(await saveConfiguration(input));await load();message.success((isFlow.value?flowEnabled(row):row.enabled)?t('ReportRepair.statusDisabled'):t('ReportRepair.statusEnabled'))
    }
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  const remove = async (row:Configuration) => {
    if(!row.id)return
    saving.value=true;error.value=''
    try {result(await (isFlow.value?deleteFlowConfiguration(row.id):deleteConfiguration(row.id)));await load();message.success(t('ReportRepair.deleted'))}
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  const categoryTreeState=computed(()=>{
    const categories=related.value.filter(row=>row.kind==='category')
    const nodes=businessProjectId.value?configurationTree(categories.filter(row=>row.businessProjectId===businessProjectId.value)):
      projectOptions.value.map(project=>({key:'project:'+project.value,title:project.label,depth:0,children:configurationTree(categories.filter(row=>row.businessProjectId===project.value))})).filter(group=>group.children.length)
    const selection=filterTerms.value.find(term=>term.column==='id'&&term.termType==='in')?.value
    return {nodes,selectedKeys:(Array.isArray(selection)?selection:selection?[selection]:[]) as string[],canSave:canSave.value,loading:loading.value}
  })
  const selectCategory=(keys:string[])=>{
    const selected=keys[0]
    if(selected?.startsWith('project:')){filterTerms.value=filterTerms.value.filter(term=>term.column!=='id');businessProjectId.value=selected.slice(8);search();return}
    filterTerms.value=[...filterTerms.value.filter(term=>term.column!=='id'),...(selected?[{column:'id',termType:'in',value:[selected]}]:[])]
    search()
  }
  const addCategory=(parent?:Configuration)=>{
    edit()
    if(parent){form.businessProjectId=parent.businessProjectId;form.parentId=parent.id}
  }
  const setDescriptionFormRef=(instance:unknown)=>{descriptions.formRef=instance as FormInstance}

  onMounted(async () => {
    try {
      await loadPermissions()
      projects.value = result(await queryProjects())
      const applicationId=useBusinessApplicationStore().currentApplication?.id
      if(applicationId){try{roleOptions.value=result(await queryApplicationRoles(applicationId)).data.map(row=>({value:row.id,label:row.name}))}catch{/* 角色查询权限独立；不阻断字典读取。 */}}
      filterTerms.value=decodeConditionFilterQuery(route.query.q,filterFields.value)
      await load()
    } catch (e) { error.value = errorMessage(e) }
  })
  return { parentTree,nameLabel,activeTab,filterFields,filterTerms,search,roleName,formSettings,configurationFormRef,isFlow,flowEditing,flowEnabled,flowCategoryOptions,selectFlowCategory,qr,leafCategory,satisfactionOptions,toggle,remove,actualKind,parentOptions,parentName,roleOptions,descriptions,setDescriptionFormRef,categoryTreeState,selectCategory,addCategory,canSave, kind, title, rows, loading, saving, error, open, form, total, current, businessProjectId, projectOptions, projectName, load, edit, save, pageChange }
}
