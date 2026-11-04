import type { RepairFormOptions } from '../types'
export interface PublicOption {id:string;name:string;kind:string;parentId:string;content:string}
export interface PublicSpace {id:string;name:string;parentId:string;selectable:boolean;positionType:number}
export interface PublicForm {formOptions?:RepairFormOptions;name:string;welcomeText:string;projectName:string;enableCampus:boolean;campusOptions:{name:string;spaceRootIds:string[]}[];configurations:PublicOption[];spaces:PublicSpace[]}
export interface PublicInput {urgency?:number;categoryId?:string;spaceId?:string;description:string;contactName:string;contactPhone:string;location:string;labelIds:string[];descriptionChoiceIds:string[];uploadIds:string[]}

/** 公开能力不发送登录令牌、租户或应用头，也不触发共享请求器的登录跳转。 */
async function publicRequest<T>(code:string,suffix:string,body?:FormData|PublicInput):Promise<T> {
  const response=await fetch('/api/repair/public/qr/'+encodeURIComponent(code)+suffix,{
    method:body?'POST':'GET',credentials:'omit',
    headers:body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{},
    ...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})
  })
  const content=await response.json()
  if(!response.ok||content.status!==200)throw new Error(content.message||'二维码不可用，请联系物业工作人员')
  return content.result as T
}
export const getPublicRepairForm=(code:string)=>publicRequest<PublicForm>(code,'')
export const submitPublicRepair=(code:string,body:PublicInput)=>publicRequest<{number:string}>(code,'/orders',body)
export const uploadPublicRepairFile=(code:string,file:File)=>{const body=new FormData();body.append('file',file);return publicRequest<{uploadId:string}>(code,'/uploads',body)}
