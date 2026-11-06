import { ref,watch,onBeforeUnmount,type Ref } from 'vue'
import { getImageUrl } from '@jetlinks-web-core/utils'
import { attachmentPreview,type AttachmentPreview } from '../services/attachments'
/** 每个详情实例独立读取；切换工单或关闭详情即取消旧请求，不缓存文件访问权限。 */
export function useAttachmentPreviews(ids:Ref<string[]>) {
  const files=ref<AttachmentPreview[]>([]),loading=ref(false)
  let sequence=0,controller:AbortController|undefined
  const load=async()=>{
    const current=++sequence;controller?.abort();controller=new AbortController()
    const signal=controller.signal;files.value=[];loading.value=ids.value.length>0
    const values=[...new Set(ids.value)]
    try{
      // 只做小范围并发，处理记录图片多时也不会同时发出大量请求。
      for(let start=0;start<values.length;start+=4){
        const batch=await Promise.all(values.slice(start,start+4).map(async id=>{
          try{return await attachmentPreview(id,signal)}
          catch{return {id,name:id,url:getImageUrl(id),image:false,failed:true}}
        }))
        if(current!==sequence)return
        files.value.push(...batch)
      }
    }finally{if(current===sequence)loading.value=false}
  }
  const imageFailed=(id:string)=>{const file=files.value.find(item=>item.id===id);if(file){file.image=false;file.failed=true}}
  watch(ids,()=>void load(),{immediate:true})
  onBeforeUnmount(()=>{sequence++;controller?.abort()})
  return {files,loading,load,imageFailed}
}
