import type {ActionInput,Configuration,Order,Process,Review} from '../types'
import {can,roleIds,state} from './session'

/** 按最新 SaaS 状态和角色呈现入口；提交仍由服务端重新核验资产、候选和版本。 */
export function availableActions(order:Order,reviews:Review[],configs:Configuration[]){
 const own=order.assignedUserId===state.authorization?.user.id,pending=reviews.filter(r=>r.status===1),roles=roleIds()
 const flow=configs.find(c=>c.id===order.categoryId)?.configuration
 const callbackRole=flow?.flowConfigured!==false&&flow?.flowEnabled!==false?String(flow?.callbackRoleId||''):''
 const choices=[order.status===0&&'dispatch',order.status===0&&'grab',order.status===6&&(own||(!order.assignedUserId&&roles.includes(order.candidateRoleId||'')))&&'accept',
  [7,1].includes(order.status)&&own&&'follow',order.status===1&&own&&!pending.length&&(!order.paid||order.signed)&&'finish',
  order.status===1&&own&&!order.paid&&'toPaid',order.status===1&&own&&order.paid&&!order.signatureRequested&&'quote',order.status===1&&order.signatureRequested&&!order.signed&&'sign',
  [8,2].includes(order.status)&&(callbackRole?roles.includes(callbackRole):own)&&'callback',[6,7,1].includes(order.status)&&!pending.length&&'transfer',
  order.status===1&&own&&!pending.some(r=>r.kind==='delay')&&'delay',order.status===1&&own&&!pending.length&&!order.paid&&'close',order.status===1&&own&&!pending.some(r=>r.kind==='levelChange')&&'changeLevel',
  [0,1,6,7].includes(order.status)&&!pending.length&&'abandonApply',[0,1,6,7].includes(order.status)&&!pending.length&&'changeCategory',
  [2,8,5].includes(order.status)&&!order.staffEvaluated&&'evaluate',[2,8,5].includes(order.status)&&!order.ownerEvaluated&&'ownerEvaluate',
  [0,1,6,7,8,9].includes(order.status)&&'urge',pending.some(r=>roles.includes(r.roleId))&&'review']
 return choices.filter((action):action is string=>typeof action==='string'&&can(action)&&(!pending.some(r=>r.kind==='abandon')||action==='review'))
}
export function signedCompletion(order:Order,history:Process[],reviews:Review[]){
 if(!order.paid||!order.signed||history.some(p=>p.action==='callback'&&p.details?.rework)||reviews.some(r=>r.kind==='archive'&&r.status===3))return
 return [...history].reverse().find(p=>p.action==='quote')
}
export function contentRule(action:string,first:boolean){
 if(action==='follow')return{label:first?'首次跟进内容':'跟进内容',max:800,required:true}
 if(['finish','quote','close'].includes(action))return{label:'完成情况',max:800,required:true}
 if(action==='callback')return{label:'回访内容',max:300,required:true}
 if(action==='review')return{label:'意见',max:800,required:true}
 if(['evaluate','ownerEvaluate'].includes(action))return{label:'评价内容',max:200,required:false}
 return{label:'备注',max:200,required:false}
}
/** 不传入已删除回复字典的正文作为新选择；签字后的完结仅使用历史可信快照。 */
export function completionInput(input:ActionInput,order:Order,quote:Process){
 input.description=quote.description||'';input.replyId=quote.details?.replyId;input.reply=quote.details?.reply
 input.materialAmount=order.materialAmount;input.artificialAmount=order.artificialAmount;input.attachmentIds=[...quote.attachmentIds||[]]
}

/** 沿用旧员工端的当前处理轮次：转派/接单重置，首次跟进或返工回访开始计时。 */
export function handlingDuration(order:Order,history:Process[],now=Date.now()):string {
 let start:number|undefined
 for(const process of [...history].sort((a,b)=>a.createTime-b.createTime)){
  if(['dispatch','transfer','grab','accept'].includes(process.action))start=undefined
  else if(process.action==='callback'&&process.details?.rework)start=process.createTime
  else if(process.action==='follow'&&start===undefined)start=process.createTime
 }
 start??=order.acceptTime
 if(start===undefined)return'—'
 const end=order.finishTime||(order.status===3?order.abandonTime:undefined)||now
 const minutes=Math.floor(Math.max(0,end-start)/60000)
 return`${Math.floor(minutes/1440)}天${Math.floor(minutes%1440/60)}小时${minutes%60}分`
}
