export interface Query { paging?: boolean; pageIndex?: number; pageSize?: number; terms?: object[]; sorts?: object[] }
export interface OperationLog { id:string; operatorId?:string; operatorName?:string; operation?:string; action?:string; httpMethod?:string; url?:string; status:number; errorType?:string; createTime:number; duration:number }
export interface Pager<T> { data: T[]; total: number; pageIndex: number; pageSize: number }
export interface SharedRecord { id: string; name?: string; displayName?: string; parentId?: string; organizationId?: string; rootId?: string; leaf?: boolean; children?: SharedRecord[] }
export type RepairFormOptions = Record<'showReportPosition'|'showReportDetailLocation'|'showReportLabel'|'showReportDescriptionChoice'|'showReportUrgency'|'showProblemDescription'|'showMediaUpload',boolean>
export interface ConfigurationData extends Partial<RepairFormOptions> {
  code?:string; channelId?:string; welcomeText?:string; categoryIds?:string[]; spaceRootIds?:string[]
  publicAreaRootIds?:string[]; enableRoom?:boolean; enableCampus?:boolean; campusOptions?:{name:string;spaceRootIds:string[]}[]
  materialVo?: CommissionRates; artificialVo?: CommissionRates
  flowConfigured?: boolean; flowEnabled?: boolean; flowRoleNames?: Record<string,string>
  callbackRequired?: boolean; callbackRoleId?: string; finishTimeLimitDays?: number
  coefficient?: number; auditRequired?: boolean; auditRoleId?: string; auditRoleName?: string; color?: string; thirdParty?: boolean
  transferLimit?: number; delayLimit?: number; delayRoleId?: string; closeRoleId?: string
  levelChangeRoleId?: string; abandonRoleId?: string; followRoleId?: string
  autoDispatchEnable?: boolean; autoDispatchMinutes?: number; autoDispatchRoleId?: string
  deviceEnabled?: boolean; content?: string; score?: number; remark?: string; satisfactionId?: string; staticNode?: number
}
export interface CommissionRates { property?: number; provider?: number; person?: number }
export interface CommerceFields {
  paid?: boolean; signatureRequested?: boolean; signed?: boolean; materialAmount?: number; artificialAmount?: number
  totalAmount?: number; personAmount?: number; providerAmount?: number; propertyAmount?: number
  signatureFileId?: string; signatureOwnerName?: string; signatureOwnerPhone?: string; signatureRecorderId?: string; signatureRecorderName?:string; signatureTime?: number
  ownerEvaluationRecorderId?:string; ownerEvaluationRecorderName?:string; ownerEvaluationTime?:number; evaluationOwnerName?: string; evaluationOwnerPhone?: string; staffEvaluated?: boolean; ownerEvaluated?: boolean; staffSatisfaction?:number; ownerSatisfaction?:number; staffSatisfactionName?:string; ownerSatisfactionName?:string
}
export interface Configuration { flowCreatorName?:string; flowModifyTime?:number; creatorName?:string; modifyTime?:number; id?: string; businessProjectId: string; kind: string; name: string; parentId?: string; sortIndex?: number; enabled?: boolean; configuration: ConfigurationData }
export interface Order extends CommerceFields { deviceId?:string; deviceName?:string; deviceProductId?:string; deviceProductName?:string; id: string; reviewId?:string; reviewKind?:string; reviewStatus?:number; reviewReason?:string; reviewApplicantName?:string; reviewCreateTime?:number; reviewTime?:number; number: string; title: string; description?: string; businessProjectId: string; businessProjectName: string; categoryId: string; categoryName: string; channelId: string; channelName: string; candidateRoleId?: string; candidateSource?: string; assignedUserId?: string; assignedUserName?: string; reporterName: string; creatorName?: string; source?: string; reportSource?: number; positionType?: number; urgency?: number; labelIds?: string[]; labelNames?: string[]; descriptionChoiceIds?: string[]; attachmentIds?: string[]; spaceName?: string; status: number; version: number; createTime: number; levelName?: string; levelColor?:string; finishTime?:number; archiveTime?:number; timedOut?:boolean; abandonTime?:number; abandonReason?:string; finishDeadline?: number; contactName: string; contactPhone: string; location?: string }
export interface DeviceOption {id:string;name:string;productId?:string;productName?:string}
export interface OrderInput { deviceId?:string; businessProjectId?: string; spaceId?: string; categoryId?: string; channelId?: string; description: string; reportSource: number; positionType: number; urgency?: number; labelIds: string[]; descriptionChoiceIds: string[]; attachmentIds: string[]; location?: string; contactName: string; contactPhone: string }
export interface SelectOption { value: string; label: string; group?: string }
export interface CategoryOption extends SelectOption { children?: CategoryOption[]; disabled?: boolean }
export interface Process { id: string; action: string; actorName: string; beforeStatus?: number; afterStatus: number; description?: string; createTime: number; attachmentIds?:string[]; details?:ActionInput }
export interface Review { id:string; orderId:string; kind:string; roleId:string; status:number; applicantName:string; reason?:string; createTime:number; delayUntil?:number; opinion?:string; reviewerName?:string; reviewTime?:number; targetLevel?:{name?:string;coefficient?:number} }
export interface ActionInput { materialAmount?:number; artificialAmount?:number; signatureFileId?:string; ownerName?:string; ownerPhone?:string; candidateRoleId?: string; candidateSource?: string; assignedUserId?: string; description: string; levelId?: string; rework: boolean; photoId?: string; attachmentIds?:string[]; reason?:string; reply?:string; delayUntil?:number; reviewId?:string; approved?:boolean; satisfaction?:number; satisfactionId?:string; satisfactionName?:string; evaluationLabelNames?:string[]; replyId?:string; evaluationLabelIds?:string[]; callbackMethod?:string; callbackResult?:string; callbackTime?:number; callbackPerson?:string; categoryId?:string; labelIds?:string[] }
export interface Authorization { user: { id: string; name?:string; username?:string }; permissions: { id: string; actions: string[] }[] }

export interface ReportRow { projectId:string; projectName:string; [key:string]:string|number }
export type ExportType = 'orders'|'review'|'summary'|'node'|'paid'|'overdue'|'follow'|'evaluation'
export interface ExportTask { id:string; name:string; status:'processing'|'completed'|'failed'; rowCount:number; sourceCount?:number; exportType?:ExportType; creatorName:string; createTime:number; completeTime?:number }

export interface DashboardPoint {name:string;total:number;noDistributed:number;handling:number;abandoned:number}
export interface Dashboard {trend:DashboardPoint[];urgency:DashboardPoint[];category:DashboardPoint[]}
