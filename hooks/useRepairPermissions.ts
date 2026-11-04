import { ref } from 'vue'
import { getAuthorization } from '../api'
import type { Authorization } from '../types'
import { result } from '../utils'

/** 页面按当前应用授权显示操作入口；服务端仍拥有最终动作授权。 */
export function useRepairPermissions() {
  const authorization = ref<Authorization>()
  const loadPermissions = async () => {
    authorization.value = result(await getAuthorization())
  }
  const can = (resource: string, action: string) =>
    !!authorization.value?.permissions.find(permission => permission.id === resource)?.actions.includes(action)

  return { loadPermissions, can }
}
