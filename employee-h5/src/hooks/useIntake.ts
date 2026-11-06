import {computed,onMounted,reactive,ref,watch} from 'vue'
import {useRouter} from 'vue-router'
import {message,type FormInstance} from 'ant-design-vue'
import * as api from '../api/repair'
import {errorText} from '../api/http'
import {state} from '../services/session'
import {name} from '../services/labels'
import {spaceOptions} from '../services/spaces'
import {useMedia} from './useMedia'
import type {Configuration,Device,OrderInput,SharedRecord} from '../types'
export function useIntake(){
 const router=useRouter(),projects=ref<SharedRecord[]>([]),spaces=ref<SharedRecord[]>([]),configs=ref<Configuration[]>([]),devices=ref<Device[]>([]),path=ref<string[]>([]),spacePath=ref<string[]>([])
 const loading=ref(false),saving=ref(false),error=ref(''),deviceLoading=ref(false),formRef=ref<FormInstance>(),manual=ref('')
 const media=useMedia(text=>error.value=text)
 const input=reactive<OrderInput>({description:'',reportSource:1,positionType:1,contactName:'',contactPhone:'',labelIds:[],descriptionChoiceIds:[],attachmentIds:[]})
 const flags=computed(()=>{const data=configs.value.find(c=>c.kind==='intakeOptions')?.configuration||{};return Object.fromEntries(['showReportPosition','showReportDetailLocation','showReportLabel','showReportDescriptionChoice','showReportUrgency','showProblemDescription','showMediaUpload'].map(k=>[k,data[k]!==false]))})
 const tree=computed(()=>{
  const build=(parent?:string,depth=1):{value:string;label:string;children?:unknown[]}[]=>configs.value.filter(c=>c.kind==='category'&&(c.parentId||undefined)===parent).sort((a,b)=>(a.sortIndex||0)-(b.sortIndex||0)).map(c=>({value:c.id,label:c.name,...depth<3?{children:build(c.id,depth+1)}:{}}))
  return build()
 })
 const labels=computed(()=>configs.value.filter(c=>c.kind==='label'&&c.parentId===input.categoryId).map(c=>({value:c.id,label:c.name})))
 const descriptions=computed(()=>configs.value.filter(c=>c.kind==='description'&&input.labelIds.includes(c.parentId||'')).map(c=>({value:c.id,label:String(c.configuration.content||c.name)})))
 const channels=computed(()=>configs.value.filter(c=>c.kind==='channel').map(c=>({value:c.id,label:c.name})))
 const deviceEnabled=computed(()=>!!configs.value.find(c=>c.id===input.categoryId)?.configuration.deviceEnabled)
 const rules=computed(()=>({businessProjectId:[{required:true,message:'请选择业务项目'}],categoryId:[{required:true,message:'请选择第三级报事分类'}],channelId:[{required:true,message:'请选择报事渠道'}],contactName:[{required:true,whitespace:true,message:'请输入报事人'},{pattern:/^\S+$/,message:'报事人中间不能有空白'}],contactPhone:[{required:true,message:'请输入联系电话'},{pattern:/^1[3-9]\d{9}$|^(0\d{2,3}-?)?\d{7,8}$/,message:'请输入正确电话或座机号'}],...flags.value.showReportLabel?{labelIds:[{type:'array',required:true,min:1,message:'请选择报事标签'}]}:{}}))
 let sequence=0,deviceSequence=0
 const searchDevices=async(text='')=>{
  if(!input.businessProjectId||!deviceEnabled.value)return
  const own=++deviceSequence;deviceLoading.value=true
  try{const data=await api.devices(input.businessProjectId,text);if(own===deviceSequence)devices.value=data.data}catch(e){if(own===deviceSequence)error.value=errorText(e)}finally{if(own===deviceSequence)deviceLoading.value=false}
 }
 watch(()=>input.businessProjectId,async id=>{
  const own=++sequence;configs.value=[];spaces.value=[];path.value=[];spacePath.value=[];input.categoryId=undefined;input.channelId=undefined;input.spaceId=undefined;input.labelIds=[];input.descriptionChoiceIds=[]
  if(!id){loading.value=false;return}loading.value=true;error.value=''
  try{const[c,s]=await Promise.all([api.configurations(id),api.spaces(id)]);if(own!==sequence)return;configs.value=c.data;spaces.value=s.data;input.channelId=c.data.find(x=>x.kind==='channel'&&['员工端H5报事','后台报事'].includes(x.name))?.id}catch(e){if(own===sequence)error.value=errorText(e)}finally{if(own===sequence)loading.value=false}
 })
 watch(spacePath,p=>{input.spaceId=p?.length?p[p.length-1]:undefined})
 watch(path,p=>{input.categoryId=p.length===3?p[2]:undefined;input.labelIds=[];input.descriptionChoiceIds=[]})
 watch(()=>input.categoryId,()=>{input.deviceId=undefined;devices.value=[];deviceSequence++;if(deviceEnabled.value)void searchDevices()})
 watch(()=>input.labelIds,()=>{const ids=new Set(descriptions.value.map(d=>d.value));input.descriptionChoiceIds=input.descriptionChoiceIds.filter(id=>ids.has(id))})
 watch(flags,f=>{if(!f.showReportPosition){input.positionType=1;spacePath.value=[];input.spaceId=undefined}if(!f.showReportDetailLocation)input.location=undefined;if(!f.showReportUrgency)input.urgency=undefined;if(!f.showReportLabel)input.labelIds=[];if(!f.showReportDescriptionChoice)input.descriptionChoiceIds=[];if(!f.showMediaUpload)input.attachmentIds=[];if(!f.showProblemDescription)manual.value=''})
 const description=computed(()=>[descriptions.value.filter(d=>input.descriptionChoiceIds.includes(d.value)).map((d,i)=>`${i+1}、${d.label}`).join('\n'),manual.value].filter(Boolean).join('\n'))
 const uploadFiles=async(files:File[])=>{input.attachmentIds=await media.upload(files,input.attachmentIds)}
 const submit=async()=>{
  if(saving.value)return
  try{await formRef.value?.validate();if(media.uploading.value)throw Error('请等待附件上传完成');if(!description.value.trim()||description.value.length>800)throw Error('请填写报事描述，合计不超过800字')}catch(e){if(e instanceof Error)error.value=e.message;return}
  saving.value=true;error.value=''
  try{const order=await api.create({...input,description:description.value,contactName:input.contactName.trim()});state.projectId=input.businessProjectId;await router.replace('/orders/'+order.id)}catch(e){error.value=errorText(e);message.error(error.value,8)}finally{saving.value=false}
 }
 onMounted(async()=>{try{projects.value=(await api.projects()).data;input.businessProjectId=state.projectId}catch(e){error.value=errorText(e)}})
 return{input,path,spacePath,loading,saving,error,formRef,flags,tree,labels,descriptions,channels,deviceEnabled,devices,deviceLoading,searchDevices,manual,description,rules,submit,uploadFiles,projectOptions:computed(()=>projects.value.map(p=>({value:p.id,label:name(p)}))),spaceOptions:computed(()=>spaceOptions(spaces.value)),...media}
}
