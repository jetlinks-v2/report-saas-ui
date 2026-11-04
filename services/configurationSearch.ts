import i18n from '@jetlinks-web-core/locales'
import type { ConditionFilterField, ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'
import type { CategoryOption, Configuration } from '../types'
import { categoryPath } from './intake'
const { t } = i18n.global

/** 分类与普通字典沿用统一条件模型，分类选中项包含下级，名称始终按原文编码。 */
export function configurationFilterFields(kind:string,rows:Configuration[]):ConditionFilterField[] {
  const names:Record<string,string>={channel:t('ReportRepair.channelName'),category:t('ReportRepair.categoryName'),label:t('ReportRepair.tagName'),evaluationLabel:t('ReportRepair.tagName')}
  if(!names[kind])return []
  const fields:ConditionFilterField[]=[{title:names[kind],dataIndex:'name',search:{type:'string'}}]
  if(kind==='category')fields.unshift({title:t('ReportRepair.issueCategory'),dataIndex:'id',search:{type:'select',termTypeOptions:['in','nin'],options:rows.filter(row=>row.kind==='category').map(row=>({value:row.id,label:categoryPath(rows,row.id).map(id=>rows.find(item=>item.id===id)?.name).join(' / ')}))}})
  return fields
}

export function configurationFilterTerms(terms:ConditionTerm[],rows:Configuration[]):ConditionTerm[] {
  return terms.map(term=>{
    if(term.terms)return {...term,terms:configurationFilterTerms(term.terms,rows) as NonNullable<ConditionTerm['terms']>}
    if(term.column!=='id'||!['in','nin'].includes(term.termType||''))return term
    const selected=(Array.isArray(term.value)?term.value:[term.value]) as string[]
    return {...term,value:[...new Set([...selected,...rows.filter(row=>row.kind==='category'&&categoryPath(rows,row.id).some(id=>selected.includes(id))).map(row=>row.id!)])]}
  })
}
export interface ConfigurationTreeNode {key:string;title:string;row?:Configuration;depth:number;children:ConfigurationTreeNode[]}

/** 树保留不可见父级下仍可访问的节点；不按名称合并不同业务项目的分类。 */
export function configurationTree(rows:Configuration[],parentId?:string,depth=1):ConfigurationTreeNode[] {
  const ids=new Set(rows.map(row=>row.id))
  return rows.filter(row=>parentId?row.parentId===parentId:!row.parentId||!ids.has(row.parentId))
    .sort((a,b)=>(a.sortIndex||0)-(b.sortIndex||0)||(a.id||'').localeCompare(b.id||''))
    .map(row=>({key:row.id!,title:row.name,row,depth,children:configurationTree(rows,row.id,depth+1)}))
}

/** 标签沿用原树的所有分类层级；分类父级限制三级深度并排除自身及下级。 */
export function configurationParentTree(rows:Configuration[],form:Configuration):CategoryOption[] {
  const categories=rows.filter(row=>row.kind==='category'&&row.businessProjectId===form.businessProjectId)
  const map=(nodes:ConfigurationTreeNode[]):CategoryOption[]=>nodes.map(node=>({value:node.key,label:node.title,
    disabled:form.kind==='category'&&(node.depth>=3||categoryPath(categories,node.key).includes(form.id||'')),children:map(node.children)}))
  return map(configurationTree(categories))
}
