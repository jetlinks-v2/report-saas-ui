import type { Query,Term } from '../types'
export type ListMode='pool'|'todo'|'related'|'paid'|'review'|'warning'|'unfinished'
export function listQuery(mode:ListMode,status:number,projectId?:string,keyword='',warning='soon'):Query{
 const terms:Term[]=[]
 if(projectId)terms.push({column:'businessProjectId',value:projectId})
 if(keyword.trim())terms.push({terms:['number','description','contactName'].map((column,index)=>({column,termType:'like',value:'%'+keyword.trim().replace(/[\\%_]/g,'\\$&')+'%',type:index?'or':'and'}))})
 // 工单池/有偿清单按读取范围筛状态；待办独立按当前处理资格查询。
 if((mode==='pool'||mode==='paid')&&status!==-1)terms.push({column:'status',value:status})
 if(mode==='todo')terms.push({column:'id',termType:'repair-todo',value:status})
 if(mode==='related'){terms.push({column:'id',termType:'repair-related',value:true});if(status!==-1)terms.push({column:'status',value:status})}
 if(mode==='paid')terms.push({column:'paid',value:true})
 if(mode==='unfinished')terms.push({column:'status',termType:'in',value:[0,6,7,1,8,9]})
 if(mode==='warning'){
  const now=Date.now();terms.push({column:'status',value:1},{column:'finishDeadline',termType:warning==='overdue'?'lt':'gte',value:now})
  if(warning!=='overdue'){const d=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);terms.push({column:'finishDeadline',termType:'lt',value:new Date(d+'T00:00:00+08:00').getTime()+172800000})}
 }
 return {terms,pageIndex:0,pageSize:20,sorts:[{name:'createTime',order:'desc'},{name:'id',order:'desc'}]}
}
