import {ref,onBeforeUnmount} from 'vue'
import * as api from '../api/repair'
import {state} from '../services/session'
import {errorText} from '../api/http'
export function useMedia(onError:(message:string)=>void){
 const uploading=ref(false),preview=ref<{url:string;type:string;name:string}>(),names=ref<Record<string,string>>({})
 const upload=async(files:File[],ids:string[])=>{
  if(uploading.value)return ids
  uploading.value=true;const result=[...ids]
  try{if(result.length+files.length>20)throw Error('最多上传20个附件');for(const file of files){const saved=await api.upload(file);result.push(saved.id);names.value[saved.id]=file.name}}catch(e){onError(errorText(e))}finally{uploading.value=false}
  return result
 }
 const closePreview=()=>{if(preview.value)URL.revokeObjectURL(preview.value.url);preview.value=undefined}
 const openPreview=async(id:string)=>{
  try{const s=state.session;if(!s)throw Error('请先登录');const r=await fetch(state.config.apiBase+'/file/'+encodeURIComponent(id),{headers:{'X-Access-Token':s.token,'X-Tenant-Domain':s.tenantDomain,'X-Asset-Scope':'business_application:'+s.applicationId}});if(!r.ok)throw Error('附件不可访问');const blob=await r.blob();closePreview();preview.value={url:URL.createObjectURL(blob),type:blob.type,name:names.value[id]||'工单附件'}}catch(e){onError(errorText(e))}
 }
 onBeforeUnmount(closePreview)
 return {uploading,names,upload,preview,openPreview,closePreview}
}
