import i18n from '@jetlinks-web-core/locales'
import { computed, reactive, ref, watch, nextTick, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import * as api from '../api'
import type { Configuration, DeviceOption, Order, OrderInput, SharedRecord } from '../types'
import { errorMessage, result } from '../utils'
import { resolveFormOptions } from '../services/formOptions'
import { categoryTree, spaceTree, intakeError, flattenSpaces } from '../services/intake'
const { t } = i18n.global

/** 发起页联动：项目→三级分类→标签→描述；过期请求不得覆盖当前项目选项。 */
export function useRepairIntake(error: Ref<string>, onCreated: (order: Order) => Promise<void>) {
  const open = ref(false), saving = ref(false), loading = ref(false), uploading = ref(false)
  const configurations = ref<Configuration[]>([]), spaces = ref<SharedRecord[]>([]), path = ref<string[]>([])
  const manualDescription = ref('')
  const formFlags=computed(()=>resolveFormOptions(configurations.value.find(row=>row.kind==='intakeOptions')?.configuration))
  const devices=ref<DeviceOption[]>([]),deviceLoading=ref(false),deviceError=ref('')
  const deviceEnabled=computed(()=>!!configurations.value.find(row=>row.id===form.categoryId)?.configuration.deviceEnabled)
  const deviceOptions=computed(()=>devices.value.map(device=>({value:device.id,label:`${device.name}（${device.id}）` })))
  let deviceSequence=0
  const searchDevices=async(text='')=>{
    const projectId=form.businessProjectId;if(!projectId||!deviceEnabled.value)return
    const request=++deviceSequence;deviceLoading.value=true;deviceError.value=''
    try{
      const terms=text?[{terms:[{column:'name',termType:'like',value:`%${text}%`},{column:'id',termType:'like',type:'or',value:`%${text}%`}]}]:[]
      const page=result(await api.queryRepairDevices(projectId,{pageSize:20,terms,sorts:[{name:'name',order:'asc'},{name:'id',order:'asc'}]}))
      if(request!==deviceSequence)return
      const selected=devices.value.find(device=>device.id===form.deviceId)
      devices.value=selected&&!page.data.some(device=>device.id===selected.id)?[selected,...page.data]:page.data
    }catch(e){if(request===deviceSequence){devices.value=[];deviceError.value=errorMessage(e)}}finally{if(request===deviceSequence)deviceLoading.value=false}
  }
  const fresh = (): OrderInput => ({ description: '', reportSource: 1, positionType: 1, labelIds: [],
    descriptionChoiceIds: [], attachmentIds: [], contactName: '', contactPhone: '' })
  const form = reactive<OrderInput>(fresh())
  watch([()=>form.businessProjectId,()=>form.categoryId],()=>{
    deviceSequence++;devices.value=[];form.deviceId=undefined;deviceError.value='';deviceLoading.value=false
    if(deviceEnabled.value)void searchDevices()
  })
  const tree = computed(() => categoryTree(configurations.value))
  const labels = computed(() => configurations.value.filter(row => row.kind === 'label' && row.parentId === form.categoryId)
    .map(row => ({ value: row.id!, label: row.name })))
  const descriptions = computed(() => configurations.value.filter(row => row.kind === 'description' && form.labelIds.includes(row.parentId || ''))
    .map(row => ({ value: row.id!, label: row.configuration.content || row.name, group:configurations.value.find(label=>label.id===row.parentId)?.name||t('ReportRepair.issueDescription') })))
  const spaceOptions = computed(() => spaceTree(spaces.value))
  const channelOptions = computed(() => configurations.value.filter(row => row.kind === 'channel').map(row => ({ value: row.id!, label: row.name })))
  let sequence = 0
  watch(() => form.businessProjectId, async id => {
    const current = ++sequence
    configurations.value = []; spaces.value = []; path.value = []; form.categoryId = undefined
    form.channelId = undefined; form.spaceId = undefined; form.labelIds = []; form.descriptionChoiceIds = []
    if (!id) return
    loading.value = true
    try {
      const terms = [{ column: 'businessProjectId', value: id }]
      const [configs, places] = await Promise.all([
        api.queryConfigurations({ paging: false, terms: [...terms, { column: 'enabled', value: true }] }),
        api.queryProjectSpaces(id)
      ])
      if (current !== sequence) return
      configurations.value = result(configs).data; spaces.value = flattenSpaces(result(places))
      form.channelId = configurations.value.find(row => row.kind === 'channel' && row.name.trim() === '后台报事')?.id
    } catch (e) { if (current === sequence) error.value = errorMessage(e) }
    finally { if (current === sequence) loading.value = false }
  })
  watch(path, value => { form.categoryId = value.at(-1); form.labelIds = []; form.descriptionChoiceIds = [] })
  watch(() => form.labelIds, () => {
    const available = new Set(descriptions.value.map(row => row.value))
    form.descriptionChoiceIds = form.descriptionChoiceIds.filter(id => available.has(id))
  })
  watch(formFlags,flags=>{
    if(!flags.showReportPosition){form.positionType=1;form.spaceId=undefined}
    if(!flags.showReportDetailLocation)form.location=undefined
    if(!flags.showReportUrgency)form.urgency=undefined
    if(!flags.showReportLabel)form.labelIds=[]
    if(!flags.showReportDescriptionChoice)form.descriptionChoiceIds=[]
    if(!flags.showMediaUpload)form.attachmentIds=[]
    if(!flags.showProblemDescription)manualDescription.value=''
  })
  const descriptionBlock = computed(() => descriptions.value.filter(row => form.descriptionChoiceIds.includes(row.value))
    .map((row, index) => `${index + 1}、${row.label}`).join('\n'))
  watch(descriptionBlock, block => { form.description = [block, manualDescription.value].filter(Boolean).join('\n') })
  const updateDescription = (value: string) => {
    const block = descriptionBlock.value
    manualDescription.value = block && value.startsWith(block) ? value.slice(block.length).replace(/^\n+/, '') : value
    form.description = value
  }
  watch(() => form.positionType, () => { form.spaceId = undefined })
  const start = async (projectId?: string) => {
    Object.assign(form, fresh(), { businessProjectId: undefined, deviceId:undefined, spaceId: undefined, categoryId: undefined, channelId: undefined, location: undefined })
    path.value = []; manualDescription.value = ''; error.value = ''; open.value = true
    await nextTick()
    form.businessProjectId = projectId
  }
  const submit = async () => {
    const invalid = intakeError(form, path.value, uploading.value,formFlags.value)
    if (invalid) { message.warning(invalid); return }
    saving.value = true; error.value = ''
    const originActive = () => open.value
    try {
      const order = result(await api.createOrder({ ...form, contactName: form.contactName.trim() }))
      const showCreated=originActive();open.value = false;if(showCreated)await onCreated(order); message.success(t('ReportRepair.issueReported'))
    } catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
  }
  return { formFlags,devices,deviceEnabled,deviceOptions,deviceLoading,deviceError,searchDevices,open, saving, loading, uploading, form, path, tree, labels, descriptions, spaceOptions, channelOptions, start, submit, updateDescription }
}
