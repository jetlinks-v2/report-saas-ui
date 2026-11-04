import type { ConfigurationData } from '../types'
export const configurationPages: Record<string, {kind:string; title:string}> = {
  reportRepairQrConfig:{kind:'qr',title:'报事二维码配置'},
  reportLevel:{kind:'level',title:'报事等级配置'}, theMatterClassification:{kind:'category',title:'报事分类配置'},
  labelSet:{kind:'label',title:'标签配置'}, theBusinessProcess:{kind:'category',title:'报事流程配置'},
  satisfaction:{kind:'satisfaction',title:'满意度配置'}, evaluationOfTheLabel:{kind:'evaluationLabel',title:'评价标签设置'},
  replyLanguageSetting:{kind:'reply',title:'回复语设置'}, reportCommissionSetting:{kind:'commission',title:'有偿报事抽佣配置'}
}
export const initialConfiguration = (kind: string): ConfigurationData => kind === 'qr'
  ? {code:'',welcomeText:'欢迎提交报事报修，我们将及时为您处理。',categoryIds:[],spaceRootIds:[],publicAreaRootIds:[],enableRoom:true,enableCampus:false,campusOptions:[]}
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
    throw new Error('三方抽佣比例合计不能超过100%')
  }
}

/** 原流程新增表单的次数/时限待填写，默认需要回访；分类保存不预先创建流程参数。 */
export const initialFlowConfiguration = ():ConfigurationData => ({flowConfigured:true,flowEnabled:true,callbackRequired:true,autoDispatchEnable:false})

export const commissionGroups = [{key:"materialVo",label:"材料费"},{key:"artificialVo",label:"人工费"}] as const
export const commissionRecipients = [{key:"property",label:"物业"},{key:"provider",label:"供方"},{key:"person",label:"责任人"}] as const

export const configurationNameLabel=(kind:string):string=>({channel:'渠道名称',category:'分类名称',label:'标签名称',satisfaction:'级别',evaluationLabel:'标签名称',reply:'回复语内容',description:'报事描述'} as Record<string,string>)[kind]||'名称'
