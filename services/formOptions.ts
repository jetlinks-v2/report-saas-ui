import type { RepairFormOptions } from '../types'
export const formOptionFields = [
  {key:'showReportPosition',label:'报事位置'}, {key:'showReportDetailLocation',label:'报事详细位置'},
  {key:'showReportLabel',label:'报事标签'}, {key:'showReportDescriptionChoice',label:'报事描述选择'},
  {key:'showReportUrgency',label:'紧急程度'}, {key:'showProblemDescription',label:'问题描述'},
  {key:'showMediaUpload',label:'图片视频上传'},
] as const
/** 旧项目未保存显示配置时默认全部显示；已保存的false不能被默认值覆盖。 */
export const resolveFormOptions = (data?:Partial<RepairFormOptions>):RepairFormOptions => Object.fromEntries(formOptionFields.map(({key})=>[key,data?.[key]!==false])) as RepairFormOptions
export function formOptionsError(data:RepairFormOptions) {
  if(data.showReportDescriptionChoice&&!data.showReportLabel)return '开启报事描述选择时，必须同时开启报事标签'
  if(!data.showReportDescriptionChoice&&!data.showProblemDescription)return '报事描述选择和问题描述至少开启一个'
}
