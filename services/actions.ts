import i18n from '@jetlinks-web-core/locales'
import type { ActionInput, Order, Process, Review } from '../types'
const { t } = i18n.global

/** 有偿签字前提交的完成内容；返工或归档审核驳回后沿用旧版重新开放编辑。 */
export function signedCompletion(order: Order, history: Process[], reviews: Review[]) {
  if (!order.paid || !order.signed || history.some(row => row.action === 'callback' && row.details?.rework)
    || reviews.some(row => row.kind === 'archive' && row.status === 3)) return undefined
  return [...history].reverse().find(row => row.action === 'quote')
}

export function actionContent(action: string, firstFollow: boolean) {
  if (action === 'follow') return { label: firstFollow ? t('ReportRepair.firstFollowUpContent') : t('ReportRepair.followUpContent'), max: 800, required: true }
  if (['finish', 'quote', 'close'].includes(action)) return { label: t('ReportRepair.completionDetails'), max: 800, required: true }
  if (action === 'callback') return { label: t('ReportRepair.followUpVisitContent'), max: 300, required: true }
  if (action === 'review') return { label: t('ReportRepair.comments'), max: 800, required: true }
  if (['evaluate', 'ownerEvaluate'].includes(action)) return { label: t('ReportRepair.ratingComments'), max: 200, required: false }
  return { label: t('ReportRepair.remark'), max: 200, required: false }
}

export function restoreCompletionForm(form: ActionInput, order: Order, quote: Process) {
  form.description = quote.description || ''
  form.reply = quote.details?.reply
  form.replyId = quote.details?.replyId
  form.attachmentIds = [...(quote.attachmentIds || [])]
  form.materialAmount = order.materialAmount
  form.artificialAmount = order.artificialAmount
}

/** 回访值已持久化为中文；仅翻译显示标签，保持历史记录与提交契约。 */
export const callbackMethodNames: Record<string, string> = {
  '电话': t('ReportRepair.phoneMethod'), '登门': t('ReportRepair.homeVisit'),
  '现场': t('ReportRepair.onSite'), '短信': t('ReportRepair.sms'),
}
export const callbackResultNames: Record<string, string> = {
  '有效': t('ReportRepair.valid'), '无效': t('ReportRepair.invalid'),
}
