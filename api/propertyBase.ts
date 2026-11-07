import i18n from '@jetlinks-web-core/locales'
import { moduleRegistry } from '@jetlinks-web-core/utils/module-registry'
import type { PropertyBaseApis, Space } from '@property-base-ui/public-api'
import type { SharedRecord } from '../types'

/** 在调用时解析公开资源，避免宿主完成模块注册前缓存到 undefined。 */
const resource = <K extends keyof PropertyBaseApis>(name: K): PropertyBaseApis[K] => {
  const api = moduleRegistry.getResourceItem<PropertyBaseApis[K]>('property-base-ui', 'apis', name)
  if (!api) throw new Error(i18n.global.t('ReportRepair.sharedBaseUnavailable'))
  return api
}

/** 保留报修 hook 的响应结构；公共 API 已解包，不再按 HTTP 响应重复解包。 */
export const queryProjects = async () => {
  const response = await resource('getProjectOptions')()
  if (response.status !== 'ready') {
    throw new Error(i18n.global.t('ReportRepair.sharedProjectsUnavailable'))
  }
  return { success: true, result: response.options }
}

const spaceRecord = (space: Space): SharedRecord => ({
  ...space,
  parentId: space.parentId ?? undefined,
  organizationId: space.organizationId ?? undefined,
  children: space.children?.map(spaceRecord),
})

export const queryProjectSpaces = async (projectId: string) => ({
  success: true,
  result: (await resource('getSpaceTree')(projectId)).map(spaceRecord),
})
