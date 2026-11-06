import { getImageUrl } from '@jetlinks-web-core/utils'
export interface AttachmentPreview { id:string;name:string;url:string;image:boolean;failed?:boolean }
/** 复用文件读取权限，用一个字节的 Range 请求判断类型，避免预览文档时下载整个文件。 */
export async function attachmentPreview(id:string,signal:AbortSignal):Promise<AttachmentPreview> {
  const url=getImageUrl(id)
  const probeUrl=new URL(url,window.location.href)
  probeUrl.searchParams.set('attachment','true')
  const response=await fetch(probeUrl.href,{headers:{Range:'bytes=0-0'},signal})
  try {
    if(!response.ok)throw new Error(`File unavailable (${response.status})`)
    const disposition=response.headers.get('content-disposition')||''
    const encoded=disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    let name=disposition.match(/filename="([^"]+)"|filename=([^;]+)/i)?.slice(1).find(Boolean)||id
    if(encoded){try{name=decodeURIComponent(encoded)}catch{/* 保留原始安全文件名。 */}}
    return {id,name,url,image:(response.headers.get('content-type')||'').toLowerCase().startsWith('image/')}
  }finally{await response.body?.cancel()}
}
