import i18n from '@jetlinks-web-core/locales'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { UploadFile } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { getPublicRepairForm, submitPublicRepair, uploadPublicRepairFile, type PublicForm, type PublicInput } from '../api/public'
import { resolveFormOptions } from '../services/formOptions'
import { publicSpaceTree } from '../services/publicRepair'
import { errorMessage } from '../utils'
const { t } = i18n.global

/** 匿名表单独立于员工会话，切换二维码时清空选项与上传回执，过期/停用错误原位展示。 */
export function usePublicRepair() {
  const route=useRoute(),definition=ref<PublicForm>(),loading=ref(false),saving=ref(false),error=ref(''),number=ref('')
  const formFlags=computed(()=>resolveFormOptions(definition.value?.formOptions))
  const position=computed(()=>definition.value?.spaces.find(row=>row.id===form.spaceId)?.positionType)
  const area=ref<number>(),files=ref<UploadFile[]>([]),receipts=new Map<string,string>()
  const form=reactive<PublicInput>({description:'',contactName:'',contactPhone:'',location:'',urgency:undefined,labelIds:[],descriptionChoiceIds:[],uploadIds:[]})
  const code=computed(()=>String(route.params.code||''));let sequence=0
  const load=async()=>{
    const current=++sequence;loading.value=true;error.value='';number.value='';definition.value=undefined;files.value=[];receipts.clear();area.value=undefined
    Object.assign(form,{categoryId:undefined,spaceId:undefined,description:'',contactName:'',contactPhone:'',location:'',urgency:undefined,labelIds:[],descriptionChoiceIds:[],uploadIds:[]})
    try{const data=await getPublicRepairForm(code.value);if(current===sequence){definition.value=data;if(data.enableCampus)area.value=0}}
    catch(e){if(current===sequence)error.value=errorMessage(e)}finally{if(current===sequence)loading.value=false}
  }
  watch(code,load,{immediate:true})
  watch(()=>form.categoryId,()=>{form.labelIds=[];form.descriptionChoiceIds=[]})
  watch(()=>form.labelIds.slice(),()=>{form.descriptionChoiceIds=form.descriptionChoiceIds.filter(id=>definition.value?.configurations.some(row=>row.id===id&&form.labelIds.includes(row.parentId)))})
  watch(area,()=>{form.spaceId=undefined})
  const categories=computed(()=>definition.value?.configurations.filter(row=>row.kind==='category').map(row=>({value:row.id,label:row.name}))||[])
  const labels=computed(()=>definition.value?.configurations.filter(row=>row.kind==='label'&&row.parentId===form.categoryId).map(row=>({value:row.id,label:row.name}))||[])
  const descriptions=computed(()=>definition.value?.configurations.filter(row=>row.kind==='description'&&form.labelIds.includes(row.parentId)).map(row=>({value:row.id,label:row.content||row.name}))||[])
  const spaces=computed(()=>definition.value?publicSpaceTree(definition.value,area.value):[])
  watch(()=>form.descriptionChoiceIds.slice(),()=>{if(!formFlags.value.showProblemDescription)form.description=descriptions.value.filter(row=>form.descriptionChoiceIds.includes(row.value)).map(row=>row.label).join('\n')})
  const appendDescriptions=()=>{
    const text=descriptions.value.filter(row=>form.descriptionChoiceIds.includes(row.value)).map(row=>row.label).join('；')
    form.description=[form.description,text].filter(Boolean).join('\n').slice(0,800)
  }
  const upload=(file:File)=>{
    if(files.value.length>=20||file.size>50*1024*1024){message.warning(t('ReportRepair.upTo20AttachmentsNoLargerThan50MB'));return false}
    const current=sequence,uid=crypto.randomUUID();files.value.push({uid,name:file.name,status:'uploading'})
    void uploadPublicRepairFile(code.value,file).then(response=>{
      if(current!==sequence)return
      receipts.set(uid,response.uploadId);files.value=files.value.map(row=>row.uid===uid?{...row,status:'done'}:row)
    }).catch(e=>{if(current===sequence){files.value=files.value.map(row=>row.uid===uid?{...row,status:'error'}:row);error.value=errorMessage(e)}})
    return false
  }
  const remove=(file:UploadFile)=>{files.value=files.value.filter(row=>row.uid!==file.uid);receipts.delete(file.uid);return true}
  const submit=async()=>{
    error.value=''
    if(!form.categoryId||!form.spaceId||(formFlags.value.showReportLabel&&!form.labelIds.length)||!form.description.trim()||!form.contactName.trim()||!form.contactPhone){error.value=t('ReportRepair.completeTheCategoryLocationTagsDescriptionAndContactInformation');return}
    if(!/^1[3-9]\d{9}$|^(0\d{2,3}-?)?\d{7,8}$/.test(form.contactPhone)){error.value=t('ReportRepair.enterAValidContactPhoneNumber');return}
    if(files.value.some(file=>file.status!=='done')){error.value=t('ReportRepair.waitForAttachmentsToFinishUploadingOrRemoveFailed');return}
    saving.value=true;const current=sequence
    try{const response=await submitPublicRepair(code.value,{...form,uploadIds:files.value.map(row=>receipts.get(row.uid)!).filter(Boolean)});if(current===sequence)number.value=response.number}
    catch(e){if(current===sequence)error.value=errorMessage(e)}finally{if(current===sequence)saving.value=false}
  }
  return {formFlags,position,definition,loading,saving,error,number,form,area,files,categories,labels,descriptions,spaces,load,upload,remove,submit,appendDescriptions}
}
