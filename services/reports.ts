import { encodeConditionFilterQuery, decodeConditionFilterQuery, type ConditionFilterField, type ConditionTerm, type ConditionExpressionNode } from '@jetlinks-web-core/components/ConditionFilter'
import type { ReportRow, SelectOption } from '../types'
import { statusNames } from '../utils'
export const reportPages:Record<string,{title:string;mode:string}>={
  index:{title:'报事统计',mode:'summary'},reportingNodeStatistics:{title:'报事节点统计',mode:'node'},
  paidReportingStatistics:{title:'有偿报事统计',mode:'paid'},overMonthStatistics:{title:'超月报事统计',mode:'overdue'},
  followUpStatistics:{title:'跟进情况统计',mode:'follow'},evaluationManagement:{title:'评价管理',mode:'evaluation'},
}
const statusColumns=[['noDistributed','待分派'],['waitAccept','待接单'],['waitFollow','待跟进'],['handling','处理中'],['finished','已完成'],['waitCallback','待回访'],['waitAudit','待审核'],['archived','已归档'],['close','已关闭'],['abandoned','已废弃']]
const reportStatus:Record<string,number>={noDistributed:0,waitAccept:6,waitFollow:7,handling:1,finished:2,waitCallback:8,waitAudit:9,archived:5,close:4,abandoned:3}
/** 只有能精确还原口径的项目与状态数提供工单钻取；比率与时长桶不冒充数量。 */
export const canDrillReport=(mode:string,key:string)=>['summary','node'].includes(mode)&&(key==='projectName'||key==='total'||key in reportStatus)
export const orderFilterFields=(projects:SelectOption[]):ConditionFilterField[]=>[
 ...reportFields(projects),
 {title:'工单状态',dataIndex:'status',search:{type:'select',options:statusNames.map((label,value)=>({label,value}))}},
]
export function reportOrderQuery(row:ReportRow,key:string,terms:ConditionTerm[],fields:ConditionFilterField[]){
 return encodeConditionFilterQuery([
  ...(terms.length?[{terms:terms as ConditionExpressionNode[]}]:[]),
  {column:'businessProjectId',termType:'eq',value:row.projectId},
  ...(key in reportStatus?[{column:'status',termType:'eq',value:reportStatus[key]}]:[]),
 ],fields)
}
/** 项目、状态快捷选择与统一 q 共用条件，保留原筛选分组及其 AND/OR 含义。 */
export function restoreOrderQuery(q:unknown,fields:ConditionFilterField[]){
 let businessProjectId:string|undefined,status:number|undefined
 const decoded:ConditionTerm[]=decodeConditionFilterQuery(q,fields)
 const conjunction=decoded.every(term=>term.type!=='or')
 const single=(column:string)=>decoded.filter(term=>!term.terms&&term.column===column&&term.termType==='eq').length===1
 const terms=decoded.filter(term=>{
  if(conjunction&&!term.terms&&term.termType==='eq'){
   if(term.column==='businessProjectId'&&single('businessProjectId')&&typeof term.value==='string'){businessProjectId=term.value;return false}
   if(term.column==='status'&&single('status')&&typeof term.value==='number'&&Number.isInteger(term.value)&&statusNames[term.value]){status=term.value;return false}
  }
  return true
 })
 return {terms,businessProjectId,status}
}
const rates=[['noDistributedRate','待分派率'],['orderRate','接单率'],['abandonedRate','废弃率'],['reportCompletionRate','报事完成率'],['orderGrabbingRate','及时抢单率'],['timelyCompletionRate','完成及时率'],['ownerEvaluationRate','业主评价率'],['positiveReviewRate','报事好评率']]
export function reportColumns(mode:string){
 const numeric=mode==='node'?statusColumns:mode==='paid'?[['paidCount','有偿报事接单量'],['paidPositiveRate','好评率'],['commissionAmount','抽佣提成金额（元）'],['materialAmount','材料费'],['artificialAmount','人工费'],['totalAmount','合计费用'],['propertyAmount','物业抽佣']]:
  mode==='overdue'?[['range1','30～59(天)'],['range2','60～89(天)'],['range3','90～119(天)'],['range4','120～365(天)'],['range5','1年以上']]:
  mode==='follow'?[['follow1','30分钟'],['follow2','1小时'],['follow3','2小时'],['follow4','1天以上']]:[['total','报事发生量'],...statusColumns,...rates]
 return [{title:'项目名称',dataIndex:'projectName',key:'projectName',fixed:'left' as const,width:220},...numeric.map(([key,title])=>({title,dataIndex:key,key,width:150,customRender:({text}:{text:ReportRow[string]})=>key.endsWith('Rate')?`${text}%`:text}))]
}
/** 筛选直接输出框架terms，统计、评价列表和导出共用同一查询条件。 */
export function reportFields(projects:SelectOption[]):ConditionFilterField[]{
 return [
  {title:'记录范围',dataIndex:'id',search:{type:'select',defaultTermType:'repair-related',termOptions:[{value:'repair-related',label:'属于'}],options:[{value:true,label:'与我相关'}]}},
  {title:'报事项目',dataIndex:'businessProjectId',search:{type:'select',options:projects}},
  ...[['number','报事编号'],['channelName','报事渠道'],['categoryName','报事分类'],['creatorName','报事登记人'],['contactName','报事人'],['contactPhone','联系方式'],['spaceName','房间号']].map(([dataIndex,title])=>({title,dataIndex,search:{type:'string'}})),
  {title:'报事位置',dataIndex:'positionType',search:{type:'select',options:[{value:1,label:'公区'},{value:2,label:'室内'}]}},
  {title:'报事来源',dataIndex:'reportSource',search:{type:'select',options:[{value:1,label:'物业自查'},{value:2,label:'业主报事'}]}},
  {title:'报事时间',dataIndex:'createTime',search:{type:'date'}},{title:'完成时间',dataIndex:'finishTime',search:{type:'date'}},
  {title:'员工已评价',dataIndex:'staffEvaluated',search:{type:'select',options:[{value:true,label:'是'},{value:false,label:'否'}]}},
  {title:'业主已评价',dataIndex:'ownerEvaluated',search:{type:'select',options:[{value:true,label:'是'},{value:false,label:'否'}]}},
 ]
}
