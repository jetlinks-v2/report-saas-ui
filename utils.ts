import i18n from '@jetlinks-web-core/locales'
const { t } = i18n.global
export const statusNames = [t('ReportRepair.awaitingAssignment'), t('ReportRepair.inProgress'), t('ReportRepair.statusFinished'), t('ReportRepair.statusDiscarded'), t('ReportRepair.closed'), t('ReportRepair.statusArchived'), t('ReportRepair.awaitingAcceptance'), t('ReportRepair.awaitingFollowUp'), t('ReportRepair.awaitingFollowUpVisit'), t('ReportRepair.pendingReview')]
export const actionNames: Record<string, string> = { create: t('ReportRepair.reportAnIssue'), dispatch: t('ReportRepair.assign'), accept: t('ReportRepair.accept'), follow: t('ReportRepair.followUp'), finish: t('ReportRepair.complete'), callback: t('ReportRepair.followUpVisit'), archive: t('ReportRepair.archive'), autoDispatch:t('ReportRepair.assignAutomaticallyAfterTimeout'), autoEvaluate:t('ReportRepair.automaticSystemRating'), timeout:t('ReportRepair.processingTimeout'), transfer:t('ReportRepair.transfer'),grab:t('ReportRepair.claim'),delay:t('ReportRepair.requestExtension'),close:t('ReportRepair.requestAbnormalClosure'),changeLevel:t('ReportRepair.changeIssuePriority'),changeCategory:t('ReportRepair.changeIssueCategory'),abandonApply:t('ReportRepair.requestDiscard'),review:t('ReportRepair.review'),evaluate:t('ReportRepair.employeeRating'),ownerEvaluate:t('ReportRepair.recordOwnerRating'),toPaid:t('ReportRepair.convertToPaidService'),quote:t('ReportRepair.submitCostsForSignature'),sign:t('ReportRepair.recordOwnerSignature'),urge:t('ReportRepair.remind') }
export const displayName = (row: { name?: string; displayName?: string }) => row.displayName || row.name || ''
export const formatTime = (time?: number) => time ? new Date(time).toLocaleString(i18n.global.locale.value === 'zh' ? 'zh-CN' : 'en-US', { hour12: false }) : '—'
export function result<T>(response: { success: boolean; result: T; message?: string }): T {
  if (!response.success) throw new Error(response.message || t('ReportRepair.operationFailed'))
  return response.result
}
export function errorMessage(error: unknown): string {
  const item = error as { response?: { data?: { message?: string } }; message?: string }
  return item.response?.data?.message || item.message || t('ReportRepair.operationFailedPleaseRetry')
}

export const reviewNames:Record<string,string>={delay:t('ReportRepair.extensionReview'),close:t('ReportRepair.abnormalClosureReview'),levelChange:t('ReportRepair.priorityChangeReview'),archive:t('ReportRepair.priorityReviewBeforeArchiving'),abandon:t('ReportRepair.discardReview')}

/** 历史导入标记使用业务文案展示；未知自定义来源保留原文。 */
export const sourceName = (source?: string) => ({
  legacy: t('ReportRepair.legacyImport'), '物业自查': t('ReportRepair.propertyInspection'), '业主报事': t('ReportRepair.ownerReport'),
} as Record<string, string>)[source || ''] || source || '—'
