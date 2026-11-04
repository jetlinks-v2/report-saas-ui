import i18n from '@jetlinks-web-core/locales'
import { resolveFormOptions } from './formOptions'
import type { CategoryOption, Configuration, OrderInput, SharedRecord, RepairFormOptions } from '../types'
const { t } = i18n.global

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
  if (uploading) return t('ReportRepair.waitForAttachmentsToFinishUploading')
  if (!form.businessProjectId) return t('ReportRepair.selectAReportingProject')
  if (!form.channelId) return t('ReportRepair.configureAndEnableAStaffReportingChannelFirst')
  if (path.length !== 3 || !form.categoryId) return t('ReportRepair.selectAThirdLevelIssueCategory')
  if (flags.showReportLabel&&!form.labelIds.length) return t('ReportRepair.selectIssueTags')
  if (!form.contactName.trim()) return t('ReportRepair.enterTheReporterName')
  if (/\s/.test(form.contactName.trim())) return t('ReportRepair.theReporterNameMustNotContainWhitespace')
  if (!/^1[3-9]\d{9}$|^(0\d{2,3}-?)?\d{7,8}$/.test(form.contactPhone)) return t('ReportRepair.enterAValidMobileOrLandlineNumber')
  if (!form.description.trim()) return t('ReportRepair.enterAnIssueDescription')
  if (form.description.length > 800) return t('ReportRepair.issueDescriptionsMustNotExceed800Characters')
}

/** 不可访问的父空间不补查、不展示；将其可见子节点提升为根，防止权限树丢项。 */
export function spaceTree(rows:SharedRecord[]):CategoryOption[] {
  const ids=new Set(rows.map(row=>row.id))
  const build=(parentId?:string,ancestors=new Set<string>()):CategoryOption[] => rows
    .filter(row=>parentId?row.parentId===parentId:!row.parentId||!ids.has(row.parentId))
    .filter(row=>!ancestors.has(row.id))
    .map(row=>{
      const children=build(row.id,new Set([...ancestors,row.id]))
      return {value:row.id,label:row.name||row.id,...(children.length?{children}:{})}
    })
  return build()
}

/** 基础接口返回树，表单仅展开有权访问的节点。 */
export const flattenSpaces = (rows: SharedRecord[]): SharedRecord[] => rows.flatMap(row => [row, ...flattenSpaces(row.children || [])])
