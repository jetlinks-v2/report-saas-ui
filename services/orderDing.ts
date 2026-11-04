import soundUrl from '../assets/dingdingding.wav'

/** 每个布局实例独占音频；暂停时也结束等待，防止旧会话继续播放队列。 */
export function createOrderDing() {
  let audio: HTMLAudioElement | undefined
  let finishPlayback: ((success: boolean) => void) | undefined
  const getAudio = () => {
    if (!audio) { audio = new Audio(soundUrl); audio.preload = 'auto' }
    return audio
  }
  const stop = () => {
    finishPlayback?.(false)
    if (audio) { audio.pause(); audio.currentTime = 0 }
  }
  const unlock = async () => {
    const current = getAudio()
    if (finishPlayback) return true
    current.muted = true
    try { await current.play(); return true }
    catch { return false }
    finally { current.pause(); current.currentTime = 0; current.muted = false }
  }
  const play = (): Promise<boolean> => {
    stop()
    const current = getAudio()
    current.muted = false
    return new Promise(resolve => {
      let settled = false
      const done = (success: boolean) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        current.removeEventListener('ended', ended)
        current.removeEventListener('error', failed)
        finishPlayback = undefined
        resolve(success)
      }
      const ended = () => done(true)
      const failed = () => done(false)
      const timeout = setTimeout(failed, 8000)
      finishPlayback = done
      current.addEventListener('ended', ended, { once: true })
      current.addEventListener('error', failed, { once: true })
      try { void current.play().catch(failed) } catch { failed() }
    })
  }
  const close = () => { stop(); audio?.removeAttribute('src'); audio?.load(); audio = undefined }
  return { play, stop, unlock, close, isPlaying: () => !!finishPlayback }
}
