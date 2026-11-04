import type { ActionInput, Order, Process, Review } from '../types'

/** 有偿签字前提交的完成内容；返工或归档审核驳回后沿用旧版重新开放编辑。 */
export function signedCompletion(order: Order, history: Process[], reviews: Review[]) {
  if (!order.paid || !order.signed || history.some(row => row.action === 'callback' && row.details?.rework)
    || reviews.some(row => row.kind === 'archive' && row.status === 3)) return undefined
  return [...history].reverse().find(row => row.action === 'quote')
}

export function actionContent(action: string, firstFollow: boolean) {
  if (action === 'follow') return { label: firstFollow ? '首次跟进内容' : '跟进内容', max: 800, required: true }
  if (['finish', 'quote', 'close'].includes(action)) return { label: '完成情况', max: 800, required: true }
  if (action === 'callback') return { label: '回访内容', max: 300, required: true }
  if (action === 'review') return { label: '意见', max: 800, required: true }
  if (['evaluate', 'ownerEvaluate'].includes(action)) return { label: '评价内容', max: 200, required: false }
  return { label: '备注', max: 200, required: false }
}

export function restoreCompletionForm(form: ActionInput, order: Order, quote: Process) {
  form.description = quote.description || ''
  form.reply = quote.details?.reply
  form.replyId = quote.details?.replyId
  form.attachmentIds = [...(quote.attachmentIds || [])]
  form.materialAmount = order.materialAmount
  form.artificialAmount = order.artificialAmount
}
