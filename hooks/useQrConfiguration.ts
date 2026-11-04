import i18n from '@jetlinks-web-core/locales'
import { computed, ref, watch, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { queryProjectSpaces } from '../api'
import { flattenSpaces } from '../services/intake'
import { categoryPath, spaceTree } from '../services/intake'
import type { Configuration, SharedRecord } from '../types'
import { errorMessage, result } from '../utils'
const { t } = i18n.global

/** 二维码管理表单的项目选项与公开链接；空间查询继续走管理端资产权限。 */
export function useQrConfiguration(form:Configuration,related:Ref<Configuration[]>) {
  const spaces=ref<SharedRecord[]>([]),loading=ref(false),error=ref('')
  const preview=ref<Configuration>()
  let sequence=0
  watch(()=>[form.kind,form.businessProjectId],async()=>{
    const current=++sequence;spaces.value=[];error.value=''
    if(form.kind!=='qr'||!form.businessProjectId)return
    loading.value=true
    try{
      const response=await queryProjectSpaces(form.businessProjectId)
      if(current===sequence)spaces.value=flattenSpaces(result(response))
    }catch(e){if(current===sequence)error.value=errorMessage(e)}finally{if(current===sequence)loading.value=false}
  })
  const projectRows=computed(()=>related.value.filter(row=>row.businessProjectId===form.businessProjectId&&row.enabled))
  const options=computed(()=>({
    loading:loading.value,error:error.value,
    channels:projectRows.value.filter(row=>row.kind==='channel').map(row=>({value:row.id!,label:row.name})),
    categories:projectRows.value.filter(row=>row.kind==='category').map(row=>({value:row.id!,label:categoryPath(projectRows.value,row.id).map(id=>projectRows.value.find(row=>row.id===id)?.name).join(' / ')})),
    spaces:spaceTree(spaces.value)
  }))
  const publicLink=(row:Configuration)=>new URL('/#/public/repair/'+encodeURIComponent(row.configuration.code||''),window.location.origin).href
  const copyLink=async(row:Configuration)=>{
    try{await navigator.clipboard.writeText(publicLink(row));message.success(t('ReportRepair.linkCopied'))}
    catch{preview.value=row;message.info(t('ReportRepair.copyTheLinkBelowTheQRCode'))}
  }
  return {options,preview,publicLink,copyLink}
}
