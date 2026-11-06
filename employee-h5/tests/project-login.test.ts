import {afterEach,test} from 'node:test'
import assert from 'node:assert/strict'
import {loginApplication} from '../src/services/projectLogin'
import {loginRequest} from '../src/api/login'
import type {RuntimeConfig,Session} from '../src/types'

const originalFetch=globalThis.fetch
const config:RuntimeConfig={applicationId:'repair-app',title:'报事报修',allowedHostOrigins:[],apiBase:'/api'}
const input={username:'worker',password:'test-password',tenantDomain:'CQHT'}
const authorized={user:{id:'app-user'},permissions:[{id:'repair-order',actions:['query']}]}
const neverVerify=async()=>{throw Error('unexpected verification')}
type Step={path:string;result?:unknown;status?:number;verify?:(init:RequestInit)=>void}
function scenario(steps:Step[]){
 globalThis.fetch=async(url,init={})=>{
  const step=steps.shift();assert.ok(step,'unexpected request '+url)
  assert.equal(String(url),'/api'+step.path);step.verify?.(init)
  const status=step.status||200
  return new Response(JSON.stringify({status,result:step.result,message:status===200?'success':'denied'}),{status})
 }
 return {done:()=>assert.equal(steps.length,0)}
}
function initial(username='worker'):Step[]{return [{path:'/authorize/captcha/config',result:{enabled:false,type:'image'}},{path:'/authorize/login',result:{token:'runtime-token'},verify:init=>{
 const body=JSON.parse(String(init.body));assert.equal(body.username,username);assert.equal(body.password,'test-password')
 const headers=new Headers(init.headers);assert.equal(headers.get('x-tenant-domain'),null);assert.equal(headers.get('x-asset-scope'),null);assert.equal(headers.get('x-access-token'),null)
}}]}
afterEach(()=>{globalThis.fetch=originalFetch})

test('application account logs into runtime directly and authorizes the selected app before returning a session',async()=>{
 const mock=scenario(initial());let checked:Session|undefined
 const result=await loginApplication(config,input,neverVerify,async session=>{checked=session;return authorized})
 assert.deepEqual(checked,{token:'runtime-token',tenantDomain:'CQHT',applicationId:'repair-app'});assert.deepEqual(result.session,checked);mock.done()
})
test('project code is user input and is not read from a built-in tenant option',async()=>{
 const mock=scenario(initial())
 const result=await loginApplication(config,{...input,tenantDomain:' OTHER '},neverVerify,async()=>authorized)
 assert.equal(result.session.tenantDomain,'OTHER');mock.done()
})
test('full runtime account names and project subaccounts are submitted unchanged',async()=>{
 const mock=scenario(initial('pm_d5c15bc91a970bd3'))
 await loginApplication(config,{...input,username:' pm_d5c15bc91a970bd3 '},neverVerify,async()=>authorized);mock.done()
})
test('missing project code fails before any credential request',async()=>{
 const mock=scenario([])
 await assert.rejects(loginApplication(config,{...input,tenantDomain:'  '},neverVerify,async()=>authorized),/请填写项目编码/);mock.done()
})
test('wrong app credentials stop before application authorization',async()=>{
 const steps=initial();steps[1].status=401
 const mock=scenario(steps);let checked=false
 await assert.rejects(loginApplication(config,input,neverVerify,async()=>{checked=true;return authorized}),/denied/)
 assert.equal(checked,false);mock.done()
})
test('an account without repair query permission cannot establish the H5 session',async()=>{
 const mock=scenario(initial())
 await assert.rejects(loginApplication(config,input,neverVerify,async()=>({user:{id:'member'},permissions:[]})),/没有报事报修访问权限/);mock.done()
})
test('server refusal of app membership or project boundary is propagated without a session',async()=>{
 const mock=scenario(initial())
 await assert.rejects(loginApplication(config,input,neverVerify,async()=>{throw Error('app access denied')}),/app access denied/);mock.done()
})
test('image verification is completed before sending runtime credentials',async()=>{
 const steps=initial();steps[0].result={enabled:true,type:'image',loginWithVerify:false}
 steps[1].verify=init=>{const body=JSON.parse(String(init.body));assert.equal(body.verifyKey,'image-key');assert.equal(body.verifyCode,'1234');assert.equal(body.username,'worker')}
 const mock=scenario(steps)
 await loginApplication(config,input,async()=>({verifyKey:'image-key',verifyCode:'1234'}),async()=>authorized);mock.done()
})
test('a captcha challenge retries the same app login with server-issued verification headers',async()=>{
 const steps=initial();steps[1]={path:'/authorize/login',status:403,result:{type:'captcha',key:'request-key',disposable:true}}
 const mock=scenario([...steps,{path:'/authorize/login',result:{token:'runtime-token'},verify:init=>{
  assert.equal(new Headers(init.headers).get('x-verify-key'),'request-key');assert.equal(new Headers(init.headers).get('x-verify-token'),'verified-token');assert.equal(JSON.parse(String(init.body)).username,'worker')
 }}]);let verified=false
 const result=await loginApplication(config,input,async requirement=>{verified=true;assert.equal(requirement.key,'request-key');return {verification:{key:'request-key',token:'verified-token'}}},async()=>authorized)
 assert.equal(verified,true);assert.equal(result.session.token,'runtime-token');mock.done()
})
test('cancelled captcha never submits a second login request',async()=>{
 const steps=initial();steps[1]={path:'/authorize/login',status:403,result:{type:'captcha',key:'request-key',disposable:true}}
 const mock=scenario(steps)
 await assert.rejects(loginApplication(config,input,async()=>{throw Error('cancelled')},async()=>authorized),/cancelled/);mock.done()
})
test('login requests reject cross-origin base URLs before sending credentials',async()=>{
 const mock=scenario([])
 await assert.rejects(loginRequest({apiBase:'https://other.example'},'/authorize/login',input),/同源路径/);mock.done()
})
