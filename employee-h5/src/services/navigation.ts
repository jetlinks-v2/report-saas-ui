import type {LocationQuery} from 'vue-router'

export type OrderScope='pool'|'todo'|'related'
export const orderScopes:{value:OrderScope;label:string}[]=[
 {value:'pool',label:'全部工单'},
 {value:'todo',label:'我的待办'},
 {value:'related',label:'与我相关'},
]
export const isOrderScope=(value:unknown):value is OrderScope=>orderScopes.some(scope=>scope.value===value)

export function orderListTitle(mode:unknown){
 if(isOrderScope(mode))return '工单'
 return ({paid:'有偿报事',review:'报事审核',warning:'物业预警',unfinished:'未完成报事'} as Record<string,string>)[String(mode)]||'工单'
}

/** 切换读取范围时保留关键词和日期上下文；状态/审核条件不能跨范围复用。 */
export function orderScopeQuery(query:LocationQuery,mode:OrderScope){
 return {...query,mode,status:-1,warning:undefined,reviewStatus:undefined,reviewKind:undefined}
}
