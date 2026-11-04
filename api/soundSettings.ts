import { request } from '@jetlinks-web/core'
import type { AxiosResponseRewrite } from '@jetlinks-web/types'
import { normalizeSoundSettings, type OrderSoundSettings } from '../services/orderSoundMonitor'
import { result } from '../utils'

const path = '/user/settings/report-repair/new-order-sound'
interface SettingsRequest {
  get(url: string): Promise<AxiosResponseRewrite<{ content?: string } | undefined>>
  patch(url: string, data: { name: string; content: string }): Promise<AxiosResponseRewrite<void>>
}
const settingsRequest = request as SettingsRequest

/** 后端始终按当前认证用户保存，不提交 userId 或覆盖人员资料。 */
export async function loadOrderSoundSettings(): Promise<OrderSoundSettings> {
  const setting = result(await settingsRequest.get(path))
  try { return normalizeSoundSettings(setting?.content ? JSON.parse(setting.content) : {}) }
  catch { return normalizeSoundSettings({}) }
}

export async function saveOrderSoundSettings(settings: OrderSoundSettings): Promise<void> {
  result(await settingsRequest.patch(path, { name: '报事报修新工单提示音', content: JSON.stringify(settings) }))
}
