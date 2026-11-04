import type { Query, ReportRow } from '../types'
import type { ConditionTerm } from '@jetlinks-web-core/components/ConditionFilter'

/** 快捷状态与旧版页签顺序一致；统计时不叠加当前快捷状态，保留用户的其他筛选。 */
export const orderStatusTabs = [
  { value: 'all', label: '全部', metric: 'total' },
  { value: '0', label: '待分派', metric: 'noDistributed' },
  { value: '6', label: '待接单', metric: 'waitAccept' },
  { value: '7', label: '待跟进', metric: 'waitFollow' },
  { value: '1', label: '处理中', metric: 'handling' },
  { value: '2', label: '已完成', metric: 'finished' },
  { value: '8', label: '待回访', metric: 'waitCallback' },
  { value: '9', label: '待审核', metric: 'waitAudit' },
  { value: '5', label: '已归档', metric: 'archived' },
  { value: '3', label: '已废弃', metric: 'abandoned' },
]

export function orderQuery(terms: ConditionTerm[], businessProjectId?: string, status?: number): Query {
  return {
    terms: [
      ...(terms.length ? [{ terms }] : []),
      ...(businessProjectId ? [{ column: 'businessProjectId', value: businessProjectId }] : []),
      ...(status === undefined ? [] : [{ column: 'status', value: status }]),
    ],
    sorts: [{ name: 'createTime', order: 'desc' }, { name: 'id', order: 'asc' }],
  }
}

export function statusCounts(rows: ReportRow[]): Record<string, number> {
  return Object.fromEntries(orderStatusTabs.map(tab => [tab.value,
    rows.reduce((sum, row) => sum + Number(row[tab.metric] || 0), 0),
  ]))
}

/** 只复制 Vue 已转义的打印区域到独立文档，避免平台导航和抽屉一起进入纸张。 */
export function printOrderSheet(element: HTMLElement, title: string): () => void {
  const frame = document.createElement('iframe')
  frame.dataset.repairPrint = 'true'
  frame.title = '工单打印'
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden'
  const dispose = () => frame.remove()
  frame.onload = () => {
    const target = frame.contentWindow
    if (!target) { dispose(); return }
    target.document.title = title
    target.addEventListener('afterprint', dispose, { once: true })
    target.focus()
    target.print()
  }
  // 业务文本由 Vue 插值编码，标题通过 DOM 属性设置，不拼接未转义的报事内容。
  frame.srcdoc = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><style>
    @page{size:A4;margin:15mm}body{font-family:Arial,"Microsoft YaHei",sans-serif;color:#000;margin:0}
    h2{text-align:center;font-size:20px}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:14px}
    th,td{border:1px solid #000;padding:8px;white-space:pre-wrap;overflow-wrap:anywhere}th{width:14%;text-align:left}
    .signature{height:48px}tr{break-inside:avoid}
    </style></head><body>${element.outerHTML}</body></html>`
  document.body.appendChild(frame)
  return dispose
}
