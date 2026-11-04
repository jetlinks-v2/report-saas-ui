import { request } from '@jetlinks-web/core'
import type { AxiosResponseRewrite } from '@jetlinks-web/types'
import type { ExportType, OperationLog, DeviceOption, Dashboard, ActionInput, ExportTask, ReportRow, Authorization, Configuration, Order, OrderInput, Pager, Process, Review, Query, SharedRecord } from '../types'
export type { Query } from '../types'
interface TypedRequest {
  put<T>(url: string, data?: unknown): Promise<AxiosResponseRewrite<T>>
  get<T>(url: string, data?: unknown): Promise<AxiosResponseRewrite<T>>
  post<T>(url: string, data?: unknown): Promise<AxiosResponseRewrite<T>>
  remove<T>(url: string): Promise<AxiosResponseRewrite<T>>
  patch<T>(url: string, data?: unknown): Promise<AxiosResponseRewrite<T>>
}
// 当前共享包的 request 未导出泛型签名，在 API 边界统一补齐响应类型。
const apiRequest = request as TypedRequest
/** 报修选项直接使用统一基础模块；绑定以根空间归属为准。 */
export const queryProjects = () => apiRequest.get<SharedRecord[]>('/property/space/_projects')
export const queryProjectSpaces = (projectId: string) => apiRequest.get<SharedRecord[]>('/property/space/_tree?projectId='+encodeURIComponent(projectId))
export const queryOrders = (query: Query) => apiRequest.post<Pager<Order>>('/repair/orders/_query', query)
export const queryOperationLogs = (query:Query) => apiRequest.post<Pager<OperationLog>>('/repair/operation-logs/_query',query)
export const countOrders = (query: Query) => apiRequest.post<number>('/repair/orders/_count', query)
export const getOrder = (id: string) => apiRequest.get<Order>(`/repair/orders/${id}`)
export const createOrder = (data: OrderInput) => apiRequest.post<Order>('/repair/orders', data)
export const actOnOrder = (order: Order, action: string, input: ActionInput, requestId: string) => apiRequest.post<Order>(`/repair/orders/${order.id}/actions/${action}`, { ...input, photoId: undefined, version: order.version, requestId, attachmentIds: [...(input.attachmentIds||[]),...(input.photoId?[input.photoId]:[])] })
export const getOrderHistory = (id: string) => apiRequest.get<Process[]>(`/repair/orders/${id}/history`)
export const queryConfigurations = (query: Query) => apiRequest.post<Pager<Configuration>>('/repair/configurations/_query', query)
export const deleteConfiguration = (id:string) => apiRequest.remove<void>(`/repair/configurations/${id}`)
export const saveConfiguration = (data: Configuration) => apiRequest.post<Configuration>('/repair/configurations', data)
export const getAuthorization = () => apiRequest.get<Authorization>('/authorize/me')

export const getAssignees = (id: string, action='dispatch') => apiRequest.get<SharedRecord[]>(`/repair/orders/${id}/${action==='transfer'?'transfer-assignees':'assignees'}`)
export const queryApplicationRoles = (applicationId: string) => apiRequest.post<Pager<{id: string; name: string}>>('/role/_query/', {paging:false,terms:[{column:'applicationId',value:applicationId}]})

export const getReviews = (id:string) => apiRequest.get<Review[]>(`/repair/orders/${id}/reviews`)

export const queryStatistics = (query:Query) => apiRequest.post<ReportRow[]>('/repair/orders/_statistics',query)
export const createExport = (query:Query,options:{type?:ExportType;reviewStatus?:number;reviewKind?:string}={}) => {
 const params=new URLSearchParams()
 if(options.type)params.set('type',options.type)
 if(options.reviewStatus!==undefined)params.set('reviewStatus',String(options.reviewStatus))
 if(options.reviewKind)params.set('reviewKind',options.reviewKind)
 return apiRequest.post<ExportTask>('/repair/orders/_exports'+(params.size?'?'+params:''),query)
}
export const queryExports = (query:Query) => apiRequest.post<Pager<ExportTask>>('/repair/orders/_exports/_query',query)
export const downloadExport = (id:string) => request.get(`/repair/orders/_exports/${id}/download`,{}, {responseType:'blob'})

export const queryDashboard = (query:Query,interval:'day'|'month') => apiRequest.post<Dashboard>(`/repair/orders/_dashboard?interval=${interval}`,query)
export const queryReviewOrders = (query:Query,status?:number,kind?:string) => apiRequest.post<Pager<Order>>(`/repair/orders/_reviews/_query?${new URLSearchParams({...status===undefined?{}:{reviewStatus:String(status)},...kind?{reviewKind:kind}:{}})}`,query)

export const queryRepairDevices = (projectId:string,query:Query) => apiRequest.post<Pager<DeviceOption>>(`/repair/orders/_devices/${encodeURIComponent(projectId)}/_query`,query)

export const deleteFlowConfiguration = (id:string) => request.remove(`/repair/configurations/${id}/flow`)
export const moveFlowConfiguration = (sourceId:string,targetId:string,data:{sourceModifyTime:number;configuration:Configuration['configuration']}) =>
 apiRequest.put<Configuration>(`/repair/configurations/${sourceId}/flow/${targetId}`,data)
