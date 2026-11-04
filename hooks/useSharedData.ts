import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import * as api from '../api'
import type { SharedRecord } from '../types'
import { displayName, errorMessage, result } from '../utils'
import { useRepairPermissions } from './useRepairPermissions'
/** 统一操作共享资料，所有扩展修改提交到同一个公共数据服务。 */
export function useSharedData() {
  const { loadPermissions, can } = useRepairPermissions()
  const canSave = computed(() => can('property-data', 'save'))
  const canSync = computed(() => can('property-data', 'sync'))
  const kind = ref('organizations'), rows = ref<SharedRecord[]>([]), projects = ref<SharedRecord[]>([])
  const loading = ref(false), saving = ref(false), error = ref(''), total = ref(0), current = ref(1)
  const options = computed(() => projects.value.map(row => ({ value: row.id, label: displayName(row) })))
  const load = async () => {
    loading.value = true; error.value = ''
    try {
      const query = { pageIndex: current.value - 1, pageSize: 20, sorts: [{ name: 'sourceName', order: 'asc' }, { name: 'id', order: 'asc' }] }
      const response = await ({ organizations: api.queryOrganizations, persons: api.queryPeople, spaces: api.querySpaces }[kind.value] || api.queryOrganizations)(query)
      const page = result(response); rows.value = page.data; total.value = page.total
      projects.value = result(await api.queryOrganizations({ pageSize: 200, terms: [{ column: 'businessProject', value: true }] })).data
    } catch (e) { error.value = errorMessage(e) } finally { loading.value = false }
  }
  const changeKind = () => { current.value = 1; void load() }
  const pageChange = (page: { current?: number }) => { current.value = page.current || 1; void load() }
  const sync = async () => {
    saving.value = true; error.value = ''
    try { const summary = result(await api.syncCloudData()); message.success(`同步完成：组织 ${summary.organizations}，人员 ${summary.persons}，空间 ${summary.spaces}`); await load() }
    catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
  }
  const save = async (row: SharedRecord, patch: object) => {
    saving.value = true; error.value = ''
    try { result(await ({ organizations: api.updateOrganization, persons: api.updatePerson, spaces: api.updateSpace }[kind.value] || api.updateOrganization)(row.id, patch)); await load(); message.success('已保存') }
    catch (e) { error.value = errorMessage(e) } finally { saving.value = false }
  }
  onMounted(async () => { try { await loadPermissions(); await load() } catch(e) { error.value = errorMessage(e) } })
  return { canSave, canSync, kind, rows, options, loading, saving, error, total, current, load, changeKind, pageChange, sync, save, displayName }
}
