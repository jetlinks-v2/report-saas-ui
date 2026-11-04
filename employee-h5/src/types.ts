/** 当前 SaaS 报修 API 的跨端数据契约；工单状态和权限以服务端结果为准。 */
export interface Session {token:string;tenantDomain:string;applicationId:string}
export interface RuntimeConfig {applicationId:string;tenantDomain:string;title:string;allowedHostOrigins:string[];apiBase:string}
export interface Authorization {user:{id:string;name?:string;username?:string};permissions:{id:string;actions:string[]}[];dimensions?:{type:string;id:string}[]}
export interface Query {pageIndex?:number;pageSize?:number;paging?:boolean;terms?:Term[];sorts?:{name:string;order:'asc'|'desc'}[]}
export interface Term {column?:string;termType?:string;value?:unknown;type?:'and'|'or';terms?:Term[]}
export interface Pager<T> {data:T[];total:number;pageIndex:number;pageSize:number}
export interface SharedRecord {id:string;sourceName?:string;displayName?:string;parentId?:string;businessProjectId?:string}
export interface Configuration {id:string;businessProjectId:string;kind:string;name:string;parentId?:string;enabled:boolean;sortIndex?:number;configuration:Record<string,unknown>}
export interface Order {
 id:string;number:string;title:string;description?:string;status:number;version:number;businessProjectId:string;businessProjectName:string;
 categoryId:string;categoryName:string;channelId:string;channelName:string;creatorId?:string;creatorName?:string;reporterName?:string;
 assignedUserId?:string;assignedUserName?:string;candidateRoleId?:string;contactName:string;contactPhone:string;location?:string;spaceName?:string;
 reportSource?:number;positionType?:number;urgency?:number;labelNames?:string[];deviceId?:string;deviceName?:string;deviceProductName?:string;
 createTime:number;acceptTime?:number;finishTime?:number;finishDeadline?:number;archiveTime?:number;abandonTime?:number;abandonReason?:string;timedOut?:boolean;levelName?:string;levelColor?:string;
 attachmentIds?:string[];paid?:boolean;signatureRequested?:boolean;signed?:boolean;signatureFileId?:string;signatureOwnerName?:string;signatureOwnerPhone?:string;
 signatureRecorderName?:string;signatureTime?:number;materialAmount?:number;artificialAmount?:number;totalAmount?:number;
 staffEvaluated?:boolean;ownerEvaluated?:boolean;staffSatisfactionName?:string;ownerSatisfactionName?:string;evaluationOwnerName?:string;ownerEvaluationRecorderName?:string;
 reviewId?:string;reviewKind?:string;reviewStatus?:number;reviewReason?:string;reviewApplicantName?:string;
}
export interface Review {id:string;kind:string;status:number;roleId:string;reason?:string;applicantName:string;createTime:number;reviewerName?:string;reviewTime?:number;opinion?:string;refuseReason?:string;delayUntil?:number;targetLevel?:{name:string}}
export interface ActionInput {description:string;reason?:string;assignedUserId?:string;levelId?:string;categoryId?:string;labelIds?:string[];attachmentIds:string[];delayUntil?:number;reviewId?:string;approved?:boolean;replyId?:string;reply?:string;materialAmount?:number;artificialAmount?:number;ownerName?:string;ownerPhone?:string;signatureFileId?:string;satisfactionId?:string;satisfaction?:number;evaluationLabelIds?:string[];callbackMethod?:string;callbackResult?:string;callbackPerson?:string;callbackTime?:number;rework?:boolean}
export interface Process {id:string;action:string;actorName:string;beforeStatus?:number;afterStatus:number;description?:string;createTime:number;attachmentIds?:string[];details?:ActionInput}
export interface OrderInput {businessProjectId?:string;categoryId?:string;channelId?:string;spaceId?:string;deviceId?:string;description:string;reportSource:number;positionType:number;urgency?:number;contactName:string;contactPhone:string;location?:string;labelIds:string[];descriptionChoiceIds:string[];attachmentIds:string[]}
export interface Device {id:string;name:string;productName?:string}
export interface FileInfo {id:string;name?:string;accessUrl?:string;contentType?:string}
export interface ReportRow {projectId:string;projectName:string;total:number;completed:number;paidCount:number;waitAudit:number;[key:string]:string|number}
