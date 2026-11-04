export const statusNames = ['待分派', '处理中', '已完结', '已废弃', '已关闭', '已归档', '待接单', '待跟进', '待回访', '待审核']
export const actionNames: Record<string, string> = { create: '发起报事', dispatch: '分派', accept: '接单', follow: '跟进', finish: '完结', callback: '回访', archive: '归档', autoDispatch:'超时自动分派', autoEvaluate:'系统默认评价', timeout:'处理超时', transfer:'转派',grab:'抢单',delay:'申请延期',close:'非正常关单申请',changeLevel:'修改报事等级',changeCategory:'修改报事分类',abandonApply:'申请废弃',review:'审核',evaluate:'员工评价',ownerEvaluate:'登记业主评价',toPaid:'转为有偿报事',quote:'提交费用待签字',sign:'登记业主签字',urge:'催办' }
export const displayName = (row: { displayName?: string; sourceName?: string }) => row.displayName || row.sourceName || ''
export const formatTime = (time?: number) => time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : '—'
export function result<T>(response: { success: boolean; result: T; message?: string }): T {
  if (!response.success) throw new Error(response.message || '操作失败')
  return response.result
}
export function errorMessage(error: unknown): string {
  const item = error as { response?: { data?: { message?: string } }; message?: string }
  return item.response?.data?.message || item.message || '操作失败，请重试'
}

export const reviewNames:Record<string,string>={delay:'延期审核',close:'非关审核',levelChange:'等级变更审核',archive:'归档前等级审核',abandon:'废弃审核'}
