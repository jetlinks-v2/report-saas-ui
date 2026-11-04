export interface OrderSoundSettings { enabled: boolean; repeatTimes: number; intervalMinutes: number }
export interface PendingSoundOrder { id: string; createTime?: number }

export function normalizeSoundSettings(value: Partial<OrderSoundSettings>): OrderSoundSettings {
  const positive = (number: unknown, fallback: number) =>
    Number.isSafeInteger(Number(number)) && Number(number) > 0 ? Number(number) : fallback
  return { enabled: value.enabled === true, repeatTimes: positive(value.repeatTimes, 1), intervalMinutes: positive(value.intervalMinutes, 5) }
}

interface SoundMonitorOptions {
  fetchPending: () => Promise<PendingSoundOrder[]>
  play: (orderId: string) => Promise<boolean>
  stopPlayback: () => void
  onBlocked: () => void
  onQueryError: (error?: unknown) => void
}

/** 一个已授权应用会话的轮询和播放队列；所有异步结果均受会话版本约束。 */
export class OrderSoundMonitor {
  private settings = normalizeSoundSettings({})
  private revision = 0
  private baseline: Set<string> | undefined
  private realtimeOrders = new Set<string>()
  private notices = new Set<string>()
  private queue: string[] = []
  private polling = false
  private playing = false
  private timer?: ReturnType<typeof setTimeout>
  private repeatTimer?: ReturnType<typeof setTimeout>
  private cancelWait?: () => void

  constructor(private readonly options: SoundMonitorOptions) {}

  start(settings: OrderSoundSettings) {
    this.stop()
    this.settings = normalizeSoundSettings(settings)
    if (!this.settings.enabled) return
    const revision = this.revision
    void this.poll(false, revision).finally(() => this.schedule(revision))
  }

  stop() {
    this.revision++
    this.settings.enabled = false
    clearTimeout(this.timer)
    clearTimeout(this.repeatTimer)
    this.cancelWait?.()
    this.cancelWait = undefined
    this.options.stopPlayback()
    this.baseline = undefined
    this.queue = []
    this.realtimeOrders.clear()
    this.notices.clear()
    this.polling = false
    this.playing = false
  }

  private active(revision: number) { return this.settings.enabled && revision === this.revision }

  private schedule(revision: number) {
    if (!this.active(revision)) return
    // 长间隔分段等待，避免超过浏览器定时器整数范围后变成高频轮询。
    let remaining = this.settings.intervalMinutes * 60_000
    const wait = () => {
      if (!this.active(revision)) return
      const delay = Math.min(remaining, 2_147_483_647)
      remaining -= delay
      this.timer = setTimeout(() => {
        if (remaining > 0) wait()
        else void this.poll(true, revision).finally(() => this.schedule(revision))
      }, delay)
    }
    wait()
  }

  async poll(announce = true, revision = this.revision) {
    if (!this.active(revision) || this.polling) return
    this.polling = true
    try {
      const records = await this.options.fetchPending()
      if (!this.active(revision)) return
      const previous = this.baseline
      this.baseline = new Set(records.map(record => record.id))
      this.options.onQueryError()
      if (previous && announce) {
        records.filter(record => !previous.has(record.id) && !this.realtimeOrders.has(record.id))
          .sort((a, b) => (a.createTime || 0) - (b.createTime || 0))
          .forEach(record => this.queue.push(record.id))
        void this.resume()
      }
    } catch (error) { if (this.active(revision)) this.options.onQueryError(error) }
    finally { if (revision === this.revision) this.polling = false }
  }

  /** 实时站内信只接收调用方已经核验归属的报修消息，重连重复消息不重复响铃。 */
  notify(noticeId: string, orderId: string) {
    if (!this.settings.enabled || this.notices.has(noticeId)) return
    this.notices.add(noticeId)
    this.realtimeOrders.add(orderId)
    for (const keys of [this.notices, this.realtimeOrders]) {
      if (keys.size > 200) keys.delete(keys.values().next().value!)
    }
    this.queue.push(orderId)
    void this.resume()
  }

  async resume() {
    if (this.playing || !this.settings.enabled) return
    this.playing = true
    const revision = this.revision
    try {
      while (this.queue.length && this.active(revision)) {
        for (let repeat = 0; repeat < this.settings.repeatTimes; repeat++) {
          if (!this.active(revision)) return
          const played = await this.options.play(this.queue[0])
          if (!this.active(revision)) return
          if (!played) { this.options.onBlocked(); return }
          if (repeat < this.settings.repeatTimes - 1) {
            await new Promise<void>(resolve => {
              this.cancelWait = resolve
              this.repeatTimer = setTimeout(resolve, 1000)
            })
            if (!this.active(revision)) return
            this.cancelWait = undefined
          }
        }
        this.queue.shift()
      }
    } finally { if (revision === this.revision) this.playing = false }
  }
}
