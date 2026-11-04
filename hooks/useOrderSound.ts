import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import { useBusinessApplicationStore, useMenuStore, useUserStore } from '@jetlinks-web-core/store'
import { useWebSocket } from '@jetlinks-web-core/hooks'
import { loadOrderSoundSettings, saveOrderSoundSettings } from '../api/soundSettings'
import { queryOrders } from '../api'
import { createOrderDing } from '../services/orderDing'
import { normalizeSoundSettings, OrderSoundMonitor } from '../services/orderSoundMonitor'
import { errorMessage, result } from '../utils'

const orderMenu = 'repair-ae6a50b29308426b932b94d33f8bab18'
interface RepairNotice { id?: string; topicProvider?: string; detail?: { applicationId?: string; orderId?: string } }

/** 挂载在现有布局扩展，生命周期覆盖本应用所有页面。 */
export function useOrderSound() {
  const { currentApplication } = storeToRefs(useBusinessApplicationStore())
  const { userInfo } = storeToRefs(useUserStore())
  const menus = useMenuStore()
  const visible = computed(() => !!userInfo.value.id && !!currentApplication.value?.id && menus.hasMenu(orderMenu))
  const contextKey = computed(() => visible.value ? `${userInfo.value.id}:${currentApplication.value!.id}` : '')
  const open = ref(false), loading = ref(false), saving = ref(false), blocked = ref(false)
  const error = ref(''), pollingError = ref('')
  const saved = ref(normalizeSoundSettings({}))
  const form = reactive(normalizeSoundSettings({}))
  const sound = createOrderDing()
  let revision = 0
  let unlockPending: Promise<boolean> | undefined
  const monitor = new OrderSoundMonitor({
    fetchPending: async () => result(await queryOrders({pageIndex:0,pageSize:100,sorts:[{name:'createTime',order:'desc'}],terms:[{column:'status',value:0}]})).data,
    play: async () => { if (unlockPending) await unlockPending; return sound.play() },
    stopPlayback: sound.stop,
    onBlocked: () => {
      if (!blocked.value) message.warning('新工单提示音播放受阻，请点击右上角“工单提示音”开启声音。')
      blocked.value = true
    },
    onQueryError: value => { pollingError.value = value ? '待分派工单刷新失败，将在下次刷新重试。' : '' },
  })
  const { send, unSubscribe } = useWebSocket<{payload?:RepairNotice}>({
    onMessage: (event) => {
      const payload = event?.payload
      if (payload?.topicProvider !== 'smart-park-repair' || payload.detail?.applicationId !== currentApplication.value?.id) return
      if (payload.id && payload.detail?.orderId) monitor.notify(payload.id, payload.detail.orderId)
    },
  })
  const apply = () => {
    unSubscribe()
    monitor.start(saved.value)
    if (saved.value.enabled && visible.value) send('repair-order-sound', '/notifications', {})
  }
  const load = async () => {
    const own = ++revision
    unSubscribe(); monitor.stop(); sound.close()
    unlockPending = undefined; saving.value = false
    open.value = false; blocked.value = false; error.value = ''; pollingError.value = ''
    saved.value = normalizeSoundSettings({}); Object.assign(form, saved.value)
    loading.value = !!contextKey.value
    if (!contextKey.value) return
    try {
      const value = await loadOrderSoundSettings()
      if (own !== revision) return
      saved.value = value; Object.assign(form, value); apply()
    } catch (value) { if (own === revision) error.value = errorMessage(value) }
    finally { if (own === revision) loading.value = false }
  }
  // 只在真实手势中解除浏览器限制，轮询不会反复请求播放授权。
  const unlock = async () => {
    if (!visible.value || !saved.value.enabled) return false
    const own = revision
    if (!unlockPending) {
      const pending = sound.unlock().finally(() => { if (unlockPending === pending) unlockPending = undefined })
      unlockPending = pending
    }
    const success = await unlockPending
    if (own !== revision) return false
    blocked.value = !success
    if (success) void monitor.resume()
    return success
  }
  const save = async () => {
    if (loading.value || saving.value || !contextKey.value) return
    if (![form.repeatTimes,form.intervalMinutes].every(value => Number.isSafeInteger(value) && value > 0)) {
      error.value = '重复次数和刷新间隔须为正整数。'; return
    }
    const own = revision
    saving.value = true; error.value = ''
    try {
      const value = normalizeSoundSettings(form)
      await saveOrderSoundSettings(value)
      if (own !== revision) return
      saved.value = value; blocked.value = false; apply(); open.value = false
      message.success('个人工单提示音设置已保存')
    } catch (value) { if (own === revision) error.value = errorMessage(value) }
    finally { if (own === revision) saving.value = false }
  }
  const show = () => { Object.assign(form, saved.value); open.value = true }
  const trySound = async () => {
    // 点击试听本身就是有效手势，即使提醒开关关闭也允许验证声音。
    if (sound.isPlaying()) return
    const own = revision
    const success = await sound.play()
    if (own !== revision) return
    if (success) { blocked.value = false; void monitor.resume() }
    else { blocked.value = true; error.value = '播放失败，请检查浏览器站点声音或自动播放设置后重试。' }
  }
  const gesture = () => { if (blocked.value || saved.value.enabled) void unlock() }
  window.addEventListener('pointerdown', gesture)
  window.addEventListener('keydown', gesture)
  watch(contextKey, () => { void load() }, { immediate: true })
  onBeforeUnmount(() => {
    revision++; unSubscribe(); monitor.stop(); sound.close()
    window.removeEventListener('pointerdown', gesture)
    window.removeEventListener('keydown', gesture)
  })
  return { visible, open, loading, saving, blocked, error, pollingError, saved, form, save, show, trySound, load }
}
