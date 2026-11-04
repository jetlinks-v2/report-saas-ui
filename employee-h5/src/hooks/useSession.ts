import { onBeforeUnmount,reactive,ref } from 'vue'
import { useRouter } from 'vue-router'
import JSEncrypt from 'jsencrypt'
import { request,errorText } from '../api/http'
import { authorize } from '../api/repair'
import { clearSession,setSession,state } from '../services/session'

export async function verifySession(){state.authorization=await authorize();if(!state.authorization.permissions.some(p=>p.id==='repair-order'&&p.actions.includes('query')))throw Error('当前账号没有报事报修访问权限')}
export function useSession(){
 const router=useRouter(),loading=ref(false),error=ref(''),captcha=ref('')
 const form=reactive({username:'',password:'',verifyCode:'',verifyKey:'',tenantDomain:state.config.tenantDomain})
 const reloadCaptcha=async()=>{try{const config=await request<{enabled:boolean;type:string}>('/authorize/captcha/config',undefined,'GET',false);if(config.enabled){if(config.type!=='image')throw Error('当前登录验证类型请通过Cloud App登录');const image=await request<{base64:string;key:string}>('/authorize/captcha/image?width=160&height=44',undefined,'GET',false);captcha.value=image.base64;form.verifyKey=image.key;form.verifyCode=''}}catch(e){error.value=errorText(e)}}
 const login=async()=>{
  if(loading.value)return
  loading.value=true;error.value=''
  try{
   if(!form.username||!form.password||!form.tenantDomain)throw Error('请填写项目编码、员工账号及密码')
   const config=await request<{encrypt?:{enabled:boolean;id:string;publicKey:string}}>('/authorize/login/configs',undefined,'GET',false)
   let password=form.password
   if(config.encrypt?.enabled){const rsa=new JSEncrypt();rsa.setPublicKey(config.encrypt.publicKey);const encrypted=rsa.encrypt(password);if(!encrypted)throw Error('密码加密失败，请重试');password=encrypted}
   const result=await request<{token:string}>('/authorize/login',{username:form.username.includes('@')?form.username:form.username+'@'+form.tenantDomain,password,verifyKey:form.verifyKey,verifyCode:form.verifyCode,encryptId:config.encrypt?.enabled?config.encrypt.id:undefined,expires:3600000},'POST',false)
   setSession({token:result.token,applicationId:state.config.applicationId,tenantDomain:form.tenantDomain})
   await verifySession();form.password='';await router.replace('/')
  }catch(e){clearSession();error.value=errorText(e);await reloadCaptcha()}finally{loading.value=false}
 }
 const logout=async()=>{loading.value=true;try{await request('/user-token/reset')}catch{/* 本地会话仍须清理。 */}finally{clearSession();loading.value=false;await router.replace('/login')}}
 const expired=()=>{error.value='登录已过期，请重新登录';void router.replace('/login')}
 window.addEventListener('repair:session-expired',expired);onBeforeUnmount(()=>window.removeEventListener('repair:session-expired',expired))
 return {form,captcha,loading,error,reloadCaptcha,login,logout}
}
