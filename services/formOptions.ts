import i18n from '@jetlinks-web-core/locales'
import type { RepairFormOptions } from '../types'
const { t } = i18n.global
export const formOptionFields = [
  {key:'showReportPosition',label:t('ReportRepair.issueLocation')}, {key:'showReportDetailLocation',label:t('ReportRepair.detailedIssueLocation')},
  {key:'showReportLabel',label:t('ReportRepair.issueTags')}, {key:'showReportDescriptionChoice',label:t('ReportRepair.issueDescriptionSelection')},
  {key:'showReportUrgency',label:t('ReportRepair.urgency')}, {key:'showProblemDescription',label:t('ReportRepair.problemDescription')},
  {key:'showMediaUpload',label:t('ReportRepair.uploadPhotosAndVideos')},
] as const
/** 旧项目未保存显示配置时默认全部显示；已保存的false不能被默认值覆盖。 */
export const resolveFormOptions = (data?:Partial<RepairFormOptions>):RepairFormOptions => Object.fromEntries(formOptionFields.map(({key})=>[key,data?.[key]!==false])) as RepairFormOptions
export function formOptionsError(data:RepairFormOptions) {
  if(data.showReportDescriptionChoice&&!data.showReportLabel)return t('ReportRepair.enableIssueTagsToUseIssueDescriptionSelection')
  if(!data.showReportDescriptionChoice&&!data.showProblemDescription)return t('ReportRepair.enableAtLeastOneOfIssueDescriptionSelectionAnd')
}
