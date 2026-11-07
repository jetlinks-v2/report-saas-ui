import i18n from '@jetlinks-web-core/locales'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { message, type FormInstance } from 'ant-design-vue'
import { useBusinessApplicationStore } from '@jetlinks-web-core/store'
import { queryApplicationRoles, queryConfigurations, queryProjects, saveConfiguration, deleteConfiguration } from '../api'
import type { Configuration, SelectOption } from '../types'
import { initialConfiguration } from '../services/configuration'
import { displayName, errorMessage, result } from '../utils'
import { useRepairPermissions } from './useRepairPermissions'
const { t } = i18n.global

/** 等级列表与内联编辑共用当前业务项目；切换项目丢弃草稿并拒绝迟到响应。 */
export function useLevelConfiguration() {
  const { can, loadPermissions } = useRepairPermissions()
  const canSave = computed(() => can('repair-configuration', 'save'))
  const projectOptions = ref<SelectOption[]>([]), roleOptions = ref<SelectOption[]>([])
  const businessProjectId = ref<string>(), keyword = ref('')
  const rows = ref<Configuration[]>([])
  const loading = ref(false), saving = ref(false), error = ref('')
  const formRef = ref<FormInstance>()
  const form = reactive<Configuration>({ kind: 'level', businessProjectId: '', name: '', enabled: true, configuration: initialConfiguration('level') })
  const visibleRows = computed(() => rows.value.filter(row => row.name.toLocaleLowerCase().includes(keyword.value.toLocaleLowerCase())))
  const previewNodes = computed(() => [
    { key: 'start', title: t('ReportRepair.issueCompleted'), type: 'normal' },
    { key: 'callback', title: t('ReportRepair.followUpVisitDecision'), type: 'normal' },
    ...(form.configuration.auditRequired ? [{ key: 'audit', title: t('ReportRepair.priorityReview'), type: 'audit' }] : []),
    ...(form.configuration.thirdParty ? [{ key: 'third', title: t('ReportRepair.thirdPartySystem'), type: 'third' }] : []),
    { key: 'archive', title: t('ReportRepair.archive'), type: 'done' },
  ])
  const select = (row?: Configuration) => {
    Object.assign(form, { id: undefined, kind: 'level', businessProjectId: businessProjectId.value || '', name: '', enabled: true,
      configuration: initialConfiguration('level') }, row ? JSON.parse(JSON.stringify(row)) : {})
    void nextTick(() => formRef.value?.clearValidate())
  }
  let sequence = 0
  const load = async (selectFirst = false) => {
    const request = ++sequence
    loading.value = true; error.value = ''
    try {
      if (!businessProjectId.value) { rows.value = []; return }
      const response = result(await queryConfigurations({ paging: false, terms: [
        { column: 'kind', value: 'level' }, { column: 'businessProjectId', value: businessProjectId.value },
      ], sorts: [{ name: 'createTime', order: 'desc' }, { name: 'id', order: 'desc' }] }))
      if (request !== sequence) return
      rows.value = response.data
      if (selectFirst) select(rows.value[0])
    } catch (e) { if (request === sequence) error.value = errorMessage(e) }
    finally { if (request === sequence) loading.value = false }
  }
  const changeAudit = (enabled: boolean) => {
    form.configuration.auditRequired = enabled
    if (!enabled) { form.configuration.auditRoleId = undefined; form.configuration.auditRoleName = undefined }
  }
  const save = async () => {
    try { await formRef.value?.validate() } catch { return }
    saving.value = true; error.value = ''
    try {
      const configuration = { ...form.configuration, auditRoleId: form.configuration.auditRequired ? form.configuration.auditRoleId : undefined,
        auditRoleName: form.configuration.auditRequired ? roleOptions.value.find(role => role.value === form.configuration.auditRoleId)?.label : undefined }
      const saved = result(await saveConfiguration({ ...form, configuration }))
      select(saved); await load(); message.success(t('ReportRepair.savedSuccessfully'))
    } catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
  }
  const remove = async () => {
    if (!form.id) return
    saving.value = true; error.value = ''
    try { result(await deleteConfiguration(form.id)); select(); await load(true); message.success(t('ReportRepair.deletedSuccessfully')) }
    catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
  }
  watch(businessProjectId, () => { keyword.value = ''; select(); void load(true) })
  onMounted(async () => {
    try {
      const applicationId = useBusinessApplicationStore().currentApplication?.id
      await Promise.all([
        loadPermissions(),
        queryProjects().then(response=>{projectOptions.value=result(response).map(row=>({value:row.id,label:displayName(row)}))}),
        applicationId?queryApplicationRoles(applicationId).then(response=>{
          roleOptions.value=result(response).data.map(row=>({value:row.id,label:row.name}))
        }).catch(()=>{/* 角色查询权限独立，不阻断等级读取。 */}):Promise.resolve(),
      ])
      businessProjectId.value = projectOptions.value[0]?.value
    } catch (e) { error.value = errorMessage(e) }
  })
  return { canSave, projectOptions, roleOptions, businessProjectId, keyword, visibleRows, loading, saving, error, formRef, form, previewNodes, select, load, changeAudit, save, remove }
}
