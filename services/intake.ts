import { resolveFormOptions } from './formOptions'
import type { CategoryOption, Configuration, OrderInput, SharedRecord, RepairFormOptions } from '../types'

/** 以父子 ID 构造三级分类，父节点仅用于导航，提交时取末级 ID。 */
export function categoryTree(rows: Configuration[], parentId?: string, depth = 1): CategoryOption[] {
  return rows.filter(row => row.kind === 'category' && (row.parentId || undefined) === parentId)
    .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0))
    .map(row => ({ value: row.id!, label: row.name,
      ...(depth < 3 ? { children: categoryTree(rows, row.id, depth + 1) } : {}) }))
}
export function categoryPath(rows: Configuration[], id?: string): string[] {
  const path: string[] = []
  while (id && path.length < 3) {
    path.unshift(id); id = rows.find(row => row.id === id)?.parentId
  }
  return path
}
export function intakeError(form: OrderInput, path: string[], uploading: boolean, flags:RepairFormOptions=resolveFormOptions()): string | undefined {
  if (uploading) return '请等待附件上传完成'
  if (!form.businessProjectId) return '请选择报事项目'
  if (!form.channelId) return '请先配置并启用后台报事渠道'
  if (path.length !== 3 || !form.categoryId) return '请选择第三级报事分类'
  if (flags.showReportLabel&&!form.labelIds.length) return '请选择报事标签'
  if (!form.contactName.trim()) return '请输入报事人'
  if (/\s/.test(form.contactName.trim())) return '报事人中间不能有空白'
  if (!/^1[3-9]\d{9}$|^(0\d{2,3}-?)?\d{7,8}$/.test(form.contactPhone)) return '请输入正确的电话号码或座机号'
  if (!form.description.trim()) return '请输入报事描述'
  if (form.description.length > 800) return '报事描述不能超过800字'
}

/** 不可访问的父空间不补查、不展示；将其可见子节点提升为根，防止权限树丢项。 */
export function spaceTree(rows:SharedRecord[]):CategoryOption[] {
  const ids=new Set(rows.map(row=>row.id))
  const build=(parentId?:string,ancestors=new Set<string>()):CategoryOption[] => rows
    .filter(row=>parentId?row.parentId===parentId:!row.parentId||!ids.has(row.parentId))
    .filter(row=>!ancestors.has(row.id))
    .map(row=>{
      const children=build(row.id,new Set([...ancestors,row.id]))
      return {value:row.id,label:row.displayName||row.sourceName||row.id,...(children.length?{children}:{})}
    })
  return build()
}
