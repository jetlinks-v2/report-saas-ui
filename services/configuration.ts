import i18n from '@jetlinks-web-core/locales'
import type { ConfigurationData } from '../types'
const { t } = i18n.global
export const configurationPages: Record<string, {kind:string; title:string}> = {
  reportRepairQrConfig:{kind:'qr',title:t('ReportRepair.issueQRCodeConfiguration')},
  reportLevel:{kind:'level',title:t('ReportRepair.issuePriorityConfiguration')}, theMatterClassification:{kind:'category',title:t('ReportRepair.issueCategoryConfiguration')},
  labelSet:{kind:'label',title:t('ReportRepair.tagConfiguration')}, theBusinessProcess:{kind:'category',title:t('ReportRepair.workflowConfiguration')},
  satisfaction:{kind:'satisfaction',title:t('ReportRepair.satisfactionConfiguration')}, evaluationOfTheLabel:{kind:'evaluationLabel',title:t('ReportRepair.ratingTagSettings')},
  replyLanguageSetting:{kind:'reply',title:t('ReportRepair.replySettings')}, reportCommissionSetting:{kind:'commission',title:t('ReportRepair.paidServiceCommissionConfiguration')}
}
export const initialConfiguration = (kind: string): ConfigurationData => kind === 'qr'
  ? {code:'',welcomeText:t('ReportRepair.welcomeSubmitYourIssueOrRepairRequestAndWe'),categoryIds:[],spaceRootIds:[],publicAreaRootIds:[],enableRoom:true,enableCampus:false,campusOptions:[]}
  : kind === 'category'
  ? { flowConfigured:false, flowEnabled:true }
  : kind === 'level' ? {coefficient:1,color:'#E5484D',auditRequired:false,thirdParty:false}
  : kind === 'commission' ? {materialVo:{},artificialVo:{}} : {}

/** 两类费用分别校验合计；保留已有记录的原始精度，服务端再按十进制数复核。 */
export async function validateCommissionTotal(data: ConfigurationData, group: 'materialVo'|'artificialVo') {
  const rates = data[group]
  const values = [rates?.property, rates?.provider, rates?.person]
  if (values.some(value => typeof value !== 'number')) return
  if (values.reduce<number>((sum,value) => sum + value!, 0) > 100) {
    throw new Error(t('ReportRepair.theCombinedCommissionRatesMustNotExceed100'))
  }
}

/** 原流程新增表单的次数/时限待填写，默认需要回访；分类保存不预先创建流程参数。 */
export const initialFlowConfiguration = ():ConfigurationData => ({flowConfigured:true,flowEnabled:true,callbackRequired:true,autoDispatchEnable:false})

export const commissionGroups = [{key:"materialVo",label:t('ReportRepair.materialCost')},{key:"artificialVo",label:t('ReportRepair.laborCost')}] as const
export const commissionRecipients = [{key:"property",label:t('ReportRepair.property')},{key:"provider",label:t('ReportRepair.provider')},{key:"person",label:t('ReportRepair.assignee')}] as const

export const configurationNameLabel=(kind:string):string=>({channel:t('ReportRepair.channelName'),category:t('ReportRepair.categoryName'),label:t('ReportRepair.tagName'),satisfaction:t('ReportRepair.rating'),evaluationLabel:t('ReportRepair.tagName'),reply:t('ReportRepair.replyContent'),description:t('ReportRepair.issueDescription')} as Record<string,string>)[kind]||t('ReportRepair.name')
