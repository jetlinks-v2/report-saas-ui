import i18n from '@jetlinks-web-core/locales'
import { encodeConditionFilterQuery, decodeConditionFilterQuery, type ConditionFilterField, type ConditionTerm, type ConditionExpressionNode } from '@jetlinks-web-core/components/ConditionFilter'
import type { ReportRow, SelectOption } from '../types'
import { statusNames } from '../utils'
const { t } = i18n.global
export const reportPages:Record<string,{title:string;mode:string}>={
  index:{title:t('ReportRepair.issueStatistics'),mode:'summary'},reportingNodeStatistics:{title:t('ReportRepair.issueNodeStatistics'),mode:'node'},
  paidReportingStatistics:{title:t('ReportRepair.paidServiceStatistics'),mode:'paid'},overMonthStatistics:{title:t('ReportRepair.issuesOpenOverAMonth'),mode:'overdue'},
  followUpStatistics:{title:t('ReportRepair.followUpStatistics'),mode:'follow'},evaluationManagement:{title:t('ReportRepair.ratingManagement'),mode:'evaluation'},
}
const statusColumns=[['noDistributed',t('ReportRepair.awaitingAssignment')],['waitAccept',t('ReportRepair.awaitingAcceptance')],['waitFollow',t('ReportRepair.awaitingFollowUp')],['handling',t('ReportRepair.inProgress')],['finished',t('ReportRepair.statusCompleted')],['waitCallback',t('ReportRepair.awaitingFollowUpVisit')],['waitAudit',t('ReportRepair.pendingReview')],['archived',t('ReportRepair.statusArchived')],['close',t('ReportRepair.closed')],['abandoned',t('ReportRepair.statusDiscarded')]]
const reportStatus:Record<string,number>={noDistributed:0,waitAccept:6,waitFollow:7,handling:1,finished:2,waitCallback:8,waitAudit:9,archived:5,close:4,abandoned:3}
/** 只有能精确还原口径的项目与状态数提供工单钻取；比率与时长桶不冒充数量。 */
export const canDrillReport=(mode:string,key:string)=>['summary','node'].includes(mode)&&(key==='projectName'||key==='total'||key in reportStatus)
export const orderFilterFields=(projects:SelectOption[]):ConditionFilterField[]=>[
 ...reportFields(projects),
 {title:t('ReportRepair.orderStatus'),dataIndex:'status',search:{type:'select',options:statusNames.map((label,value)=>({label,value}))}},
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
const rates=[['noDistributedRate',t('ReportRepair.unassignedRate')],['orderRate',t('ReportRepair.acceptanceRate')],['abandonedRate',t('ReportRepair.discardRate')],['reportCompletionRate',t('ReportRepair.issueCompletionRate')],['orderGrabbingRate',t('ReportRepair.timelyClaimRate')],['timelyCompletionRate',t('ReportRepair.timelyCompletionRate')],['ownerEvaluationRate',t('ReportRepair.ownerRatingRate')],['positiveReviewRate',t('ReportRepair.positiveIssueRatingRate')]]
export function reportColumns(mode:string){
 const numeric=mode==='node'?statusColumns:mode==='paid'?[['paidCount',t('ReportRepair.paidOrdersAccepted')],['paidPositiveRate',t('ReportRepair.positiveRatingRate')],['commissionAmount',t('ReportRepair.commissionAmountCNY')],['materialAmount',t('ReportRepair.materialCost')],['artificialAmount',t('ReportRepair.laborCost')],['totalAmount',t('ReportRepair.totalCost')],['propertyAmount',t('ReportRepair.propertyCommission')]]:
  mode==='overdue'?[['range1',t('ReportRepair.3059Days')],['range2',t('ReportRepair.6089Days')],['range3',t('ReportRepair.90119Days')],['range4',t('ReportRepair.120365Days')],['range5',t('ReportRepair.over1Year')]]:
  mode==='follow'?[['follow1',t('ReportRepair.30Minutes')],['follow2',t('ReportRepair.1Hour')],['follow3',t('ReportRepair.2Hours')],['follow4',t('ReportRepair.over1Day')]]:[['total',t('ReportRepair.issueVolume')],...statusColumns,...rates]
 return [{title:t('ReportRepair.projectName'),dataIndex:'projectName',key:'projectName',fixed:'left' as const,width:220},...numeric.map(([key,title])=>({title,dataIndex:key,key,width:150,customRender:({text}:{text:ReportRow[string]})=>key.endsWith('Rate')?`${text}%`:text}))]
}
/** 筛选直接输出框架terms，统计、评价列表和导出共用同一查询条件。 */
export function reportFields(projects:SelectOption[]):ConditionFilterField[]{
 return [
  {title:t('ReportRepair.recordScope'),dataIndex:'id',search:{type:'select',defaultTermType:'repair-related',termOptions:[{value:'repair-related',label:t('ReportRepair.belongsTo')}],options:[{value:true,label:t('ReportRepair.relatedToMe')}]}},
  {title:t('ReportRepair.reportingProject'),dataIndex:'businessProjectId',search:{type:'select',options:projects}},
  ...[['number',t('ReportRepair.issueNumber')],['channelName',t('ReportRepair.reportingChannel')],['categoryName',t('ReportRepair.issueCategory')],['creatorName',t('ReportRepair.recordedBy')],['contactName',t('ReportRepair.reportedBy')],['contactPhone',t('ReportRepair.contactInformation')],['spaceName',t('ReportRepair.roomNumber')]].map(([dataIndex,title])=>({title,dataIndex,search:{type:'string'}})),
  {title:t('ReportRepair.issueLocation'),dataIndex:'positionType',search:{type:'select',options:[{value:1,label:t('ReportRepair.commonArea')},{value:2,label:t('ReportRepair.indoors')}]}},
  {title:t('ReportRepair.issueSource'),dataIndex:'reportSource',search:{type:'select',options:[{value:1,label:t('ReportRepair.propertyInspection')},{value:2,label:t('ReportRepair.ownerReport')}]}},
  {title:t('ReportRepair.reported'),dataIndex:'createTime',search:{type:'date'}},{title:t('ReportRepair.completed'),dataIndex:'finishTime',search:{type:'date'}},
  {title:t('ReportRepair.ratedByEmployee'),dataIndex:'staffEvaluated',search:{type:'select',options:[{value:true,label:t('ReportRepair.yes')},{value:false,label:t('ReportRepair.no')}]}},
  {title:t('ReportRepair.ratedByOwner'),dataIndex:'ownerEvaluated',search:{type:'select',options:[{value:true,label:t('ReportRepair.yes')},{value:false,label:t('ReportRepair.no')}]}},
 ]
}
