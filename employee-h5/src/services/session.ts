import { reactive } from 'vue'
import { randomId } from '../utils/randomId'
import type { Authorization, RuntimeConfig, Session } from '../types'

export const state=reactive<{config:RuntimeConfig;session?:Session;authorization?:Authorization;projectId?:string;ready:boolean}>({config:{applicationId:'',tenantDomain:'',title:'报事报修',allowedHostOrigins:[],apiBase:'/api'},ready:false})
const KEY='repair-h5:session'
export async function initializeConfig(){
 const response=await fetch('/config.json',{cache:'no-store'});if(!response.ok)throw Error('无法加载应用配置')
 state.config=await response.json() as RuntimeConfig
 if(!state.config.apiBase.startsWith('/')||state.config.apiBase.startsWith('//'))throw Error('接口须配置为同源路径')
 try{const stored=JSON.parse(sessionStorage.getItem(KEY)||'null') as Session|null;if(stored?.token&&stored.applicationId===state.config.applicationId&&stored.tenantDomain===state.config.tenantDomain)state.session=stored}catch{sessionStorage.removeItem(KEY)}
}
export function setSession(session:Session){state.authorization=undefined;state.projectId=undefined;state.session=session;sessionStorage.setItem(KEY,JSON.stringify(session))}
export function clearSession(){state.session=undefined;state.authorization=undefined;state.projectId=undefined;sessionStorage.removeItem(KEY)}
export const can=(action:string)=>!!state.authorization?.permissions.find(p=>p.id==='repair-order')?.actions.includes(action)
export const roleIds=()=>state.authorization?.dimensions?.filter(d=>d.type==='role').map(d=>d.id)||[]

/** 仅受信宿主可交接会话；业务身份和应用授权随后必须通过真实后端核验。 */
export function attachHostBridge(onSession:()=>Promise<void>){
 const nonce=randomId()
 const receive=async(event:MessageEvent)=>{
  if(!state.config.allowedHostOrigins.includes(event.origin)||event.source!==window.parent||window.parent===window)return
  const data=event.data as {type?:string;nonce?:string;session?:Session}
  if(data?.type!=='jetlinks.repair.session'||data.nonce!==nonce||!data.session)return
  const s=data.session
  if(typeof s.token!=='string'||!s.token||s.applicationId!==state.config.applicationId||s.tenantDomain!==state.config.tenantDomain)return
  setSession(s);await onSession()
 }
 window.addEventListener('message',receive)
 if(window.parent!==window)for(const origin of state.config.allowedHostOrigins)window.parent.postMessage({type:'jetlinks.repair.ready',nonce,applicationId:state.config.applicationId},origin)
 return()=>window.removeEventListener('message',receive)
}
