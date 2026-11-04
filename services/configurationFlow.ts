import i18n from '@jetlinks-web-core/locales'
import type { ConditionFilterField, ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'
import type { CategoryOption, ConfigurationData, Configuration, SelectOption } from '../types'
import { categoryPath } from './intake'
const { t } = i18n.global

/** 分类可选父节点，查询时包含其下所有分类；流程操作人和时间与分类本身独立。 */
export function flowFilterFields(rows:Configuration[]):ConditionFilterField[] {
  return [
    {title:t('ReportRepair.issueCategory'),dataIndex:'flowCategoryId',search:{type:'select',termTypeOptions:['in','nin'],options:rows.filter(row=>row.kind==='category').map(row=>({value:row.id,label:categoryPath(rows,row.id).map(id=>rows.find(item=>item.id===id)?.name).join(' / ')}))}},
    {title:t('ReportRepair.operator'),dataIndex:'flowCreatorName',search:{type:'string'}},
    {title:t('ReportRepair.updated'),dataIndex:'flowModifyTime',search:{type:'date'}},
  ]
}

/** 既有已持久化的合并记录尚无流程元数据时，查询与表格使用相同的历史字段。 */
export function flowFilterTerms(terms:ConditionTerm[],rows:Configuration[]):ConditionTerm[] {
  return terms.map(term=>{
    if(term.terms)return {...term,terms:flowFilterTerms(term.terms,rows) as NonNullable<ConditionTerm['terms']>}
    if(term.column==='flowCategoryId'){
      const selected=(Array.isArray(term.value)?term.value:[term.value]) as string[]
      const descendants=rows.filter(row=>row.kind==='category'&&categoryPath(rows,row.id).some(id=>selected.includes(id))).map(row=>row.id!)
      return {...term,column:'id',value:[...new Set([...selected,...descendants])]}
    }
    const previous=term.column==='flowCreatorName'?'creatorName':term.column==='flowModifyTime'?'modifyTime':undefined
    if(!previous)return term
    return {type:term.type,terms:[
      {terms:[{column:term.column!,termType:'notnull',value:1},{column:term.column!,termType:term.termType!,value:term.value}]},
      {type:'or',terms:[{column:term.column!,termType:'isnull',value:1},{column:previous,termType:term.termType!,value:term.value}]},
    ]}
  })
}

const roleKeys=['closeRoleId','delayRoleId','followRoleId','levelChangeRoleId','abandonRoleId','callbackRoleId','autoDispatchRoleId'] as const
/** 配置管理员保存角色显示快照；授权判断始终使用角色ID和平台当前授权。 */
export function flowRoleNames(row:Configuration,roles:SelectOption[]):Record<string,string> {
  return Object.fromEntries(roleKeys.flatMap(key=>{
    const id=row.configuration[key],name=roles.find(role=>role.value===id)?.label||row.configuration.flowRoleNames?.[key]
    return id&&name?[[key,name]]:[]
  }))
}
export function flowRoleName(row:Configuration,key:typeof roleKeys[number],roles:SelectOption[]):string {
  return row.configuration.flowRoleNames?.[key]||roles.find(role=>role.value===row.configuration[key])?.label||(row.configuration[key]?t('ReportRepair.roleUnavailable'):'—')
}


const flowKeys = ['flowConfigured','flowEnabled','callbackRequired','callbackRoleId','finishTimeLimitDays','transferLimit','delayLimit',
  'delayRoleId','closeRoleId','levelChangeRoleId','abandonRoleId','followRoleId','autoDispatchEnable','autoDispatchMinutes','autoDispatchRoleId','remark','flowRoleNames'] as const
/** 切换分类只保留当前编辑的流程参数，分类与设备资料取所选分类。 */
export function flowDraft(data:ConfigurationData):ConfigurationData {
  return Object.fromEntries(flowKeys.filter(key=>Object.hasOwn(data,key)).map(key=>[key,data[key]]))
}

/** 原流程树支持所有分类层级；已占用节点仍展示，防止丢失其可选下级。 */
export function flowCategoryTree(rows:Configuration[],sourceId?:string,parentId?:string):CategoryOption[] {
  const visible=new Set(rows.map(row=>row.id))
  return rows.filter(row=>parentId?row.parentId===parentId:!row.parentId||!visible.has(row.parentId))
    .sort((a,b)=>(a.sortIndex||0)-(b.sortIndex||0))
    .map(row=>({value:row.id!,label:row.name,disabled:flowConfigured(row.configuration)&&row.id!==sourceId,
      children:flowCategoryTree(rows,sourceId,row.id)}))
}

/** 无流程标记的旧分类仅在实际存有流程参数时作为流程；设备配置不创建流程。 */
export function flowConfigured(data:ConfigurationData):boolean {
  return typeof data.flowConfigured==='boolean'?data.flowConfigured:
    flowKeys.some(key=>key!=='flowConfigured'&&key!=='flowEnabled'&&Object.hasOwn(data,key))
}
