import {computed,reactive,ref,watch} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import type {FormInstance} from 'ant-design-vue'
import * as api from '../api/repair'
import {errorText} from '../api/http'
import {availableActions,signedCompletion,completionInput,contentRule} from '../services/orderActions'
import {name} from '../services/labels'
import {roleIds,state} from '../services/session'
import {useMedia} from './useMedia'
import {randomId} from '../utils/randomId'
import type {ActionInput,Configuration,Order,Review,SharedRecord} from '../types'
export function useAction(){
 const route=useRoute(),router=useRouter(),action=computed(()=>String(route.params.action)),order=ref<Order>(),configs=ref<Configuration[]>([]),reviews=ref<Review[]>([]),people=ref<SharedRecord[]>([])
 const loading=ref(false),saving=ref(false),error=ref(''),readOnly=ref(false),allowed=ref(false),formRef=ref<FormInstance>()
 const media=useMedia(text=>error.value=text),input=reactive<ActionInput>({description:'',attachmentIds:[],rework:false,approved:true}),requestId=ref(randomId())
 const configOptions=(kind:string)=>configs.value.filter(c=>c.kind===kind).map(c=>({value:c.id,label:c.name}))
 const levels=computed(()=>configOptions('level')),categories=computed(()=>{const rows=configs.value.filter(c=>c.kind==='category');return rows.filter(c=>{let d=1,p=c.parentId;while(p&&d<4){d++;p=rows.find(r=>r.id===p)?.parentId}return d===3}).map(c=>({value:c.id,label:c.name}))})
 const labels=computed(()=>configs.value.filter(c=>c.kind==='label'&&c.parentId===input.categoryId).map(c=>({value:c.id,label:c.name})))
 const satisfaction=computed(()=>configs.value.filter(c=>c.kind==='satisfaction').sort((a,b)=>Number(a.configuration.score)-Number(b.configuration.score)).map(c=>({value:c.id,label:c.name})))
 const evaluationLabels=computed(()=>configs.value.filter(c=>c.kind==='evaluationLabel'&&c.configuration.satisfactionId===input.satisfactionId).map(c=>({value:c.id,label:c.name})))
 const replies=computed(()=>configs.value.filter(c=>c.kind==='reply'&&Number(c.configuration.staticNode)===({follow:5,finish:1,quote:1,close:7} as Record<string,number>)[action.value]).map(c=>({value:c.id,label:String(c.configuration.content||c.name)})))
 const eligibleReviews=computed(()=>reviews.value.filter(r=>r.status===1&&roleIds().includes(r.roleId)))
 const content=computed(()=>contentRule(action.value,order.value?.status===7))
 const showContent=computed(()=>!['accept','grab','toPaid','sign','changeCategory','changeLevel','delay','abandonApply'].includes(action.value))
 const reasonLabel=computed(()=>action.value==='delay'?'延期原因':action.value==='abandonApply'?'废弃原因':action.value==='review'?'不通过原因':'备注')
 const reasonLimit=computed(()=>['delay','review'].includes(action.value)?800:200)
 const rules=computed(()=>{
  const fields:Record<string,object[]>={},required=(key:string,label:string)=>fields[key]=[{required:true,message:label,whitespace:true}]
  if(showContent.value)fields.description=[{required:content.value.required,whitespace:content.value.required,max:content.value.max,message:'请填写'+content.value.label+'（最多'+content.value.max+'字）'}]
  if(['dispatch','transfer'].includes(action.value))required('assignedUserId','请选择责任人')
  if(action.value==='changeLevel'||action.value==='follow'&&order.value?.status===7)required('levelId','请选择等级')
  if(action.value==='follow'&&order.value?.status===7)fields.attachmentIds=[{type:'array',required:true,min:1,message:'首次跟进须上传到场照片'}]
  if(action.value==='changeCategory'){required('categoryId','请选择第三级分类');fields.labelIds=[{type:'array',required:true,min:1,message:'请选择标签'}]}
  if(['delay','abandonApply'].includes(action.value)||action.value==='review'&&input.approved===false)required('reason','请填写'+reasonLabel.value)
  if(action.value==='delay')fields.delayUntil=[{required:true,message:'请选择延期时间'},{validator:async()=>{if(input.delayUntil&&order.value?.finishDeadline&&input.delayUntil<=order.value.finishDeadline)throw Error('延期时间须晚于原完成时限')}}]
  if(['finish','quote','close'].includes(action.value)&&!readOnly.value)required('replyId','请选择回复语')
  if(['evaluate','ownerEvaluate','callback'].includes(action.value))required('satisfactionId','请选择满意度')
  if(action.value==='review')required('reviewId','请选择审核申请')
  if(action.value==='callback'){
   for(const [key,label]of Object.entries({callbackMethod:'回访方式',callbackResult:'回访结果',callbackPerson:'回访人'}))required(key,'请填写'+label)
   // DatePicker 提交毫秒时间戳，不能套用文本字段的 whitespace 校验。
   fields.callbackTime=[{required:true,type:'number',message:'请选择回访时间'}]
  }
  if(action.value==='quote')for(const key of ['materialAmount','artificialAmount'])fields[key]=[{required:true,type:'number',min:0,message:'请输入非负费用'}]
  if(['sign','ownerEvaluate'].includes(action.value)){required('ownerName','请填写业主姓名');required('ownerPhone','请填写业主联系方式');if(action.value==='sign')required('signatureFileId','请采集或上传业主签字')}
  return fields
 })
 const load=async()=>{
  loading.value=true;allowed.value=false;error.value=''
  try{const id=String(route.params.id),[o,h,r]=await Promise.all([api.order(id),api.history(id),api.reviews(id)]),c=await api.configurations(o.businessProjectId);order.value=o;reviews.value=r;configs.value=c.data
   if(!availableActions(o,r,c.data).includes(action.value))throw Error('当前状态或权限不允许此操作，请返回刷新工单')
   allowed.value=true
   if(['dispatch','transfer'].includes(action.value))people.value=(await api.assignees(id,action.value==='transfer')).filter(p=>action.value!=='transfer'||p.id!==o.assignedUserId)
   input.replyId=replies.value[0]?.value;input.reviewId=eligibleReviews.value[0]?.id
   if(action.value==='callback'){input.callbackMethod='电话';input.callbackResult='有效';input.callbackTime=Date.now();input.callbackPerson=state.authorization?.user.name||state.authorization?.user.username}
   const quote=signedCompletion(o,h,r);if(action.value==='finish'&&quote){readOnly.value=true;completionInput(input,o,quote)}
  }catch(e){error.value=errorText(e)}finally{loading.value=false}
 }
 const save=async()=>{
  if(saving.value||!order.value||!allowed.value)return
  try{await formRef.value?.validate();if(media.uploading.value)throw Error('请等待附件上传完成')}catch(e){if(e instanceof Error)error.value=e.message;return}
  saving.value=true;error.value=''
  try{await api.action(order.value,action.value,{...input,delayUntil:input.delayUntil?Number(input.delayUntil):undefined},requestId.value);await router.replace('/orders/'+order.value.id)}catch(e){error.value=errorText(e)}finally{saving.value=false}
 }
 const uploadFiles=async(files:File[])=>{input.attachmentIds=await media.upload(files,input.attachmentIds)}
 const uploadSignature=async(file:File)=>{const ids=await media.upload([file],[]);if(ids[0])input.signatureFileId=ids[0]}
 watch(()=>input.categoryId,()=>input.labelIds=[]);watch(()=>input.satisfactionId,()=>input.evaluationLabelIds=[])
 watch(()=>route.fullPath,()=>void load(),{immediate:true})
 const changeType=(value:string)=>{if(order.value&&!order.value.paid&&!readOnly.value)void router.replace(`/orders/${order.value.id}/action/${value}`)}
 return{action,order,loading,saving,error,readOnly,allowed,formRef,input,levels,categories,labels,satisfaction,evaluationLabels,replies,eligibleReviews,content,showContent,reasonLabel,reasonLimit,rules,save,load,uploadFiles,uploadSignature,changeType,peopleOptions:computed(()=>people.value.map(p=>({value:p.id,label:name(p)}))),...media}
}
