import {afterEach,beforeEach,test} from 'node:test'
import assert from 'node:assert/strict'
import {initializeConfig,state} from '../src/services/session'

const originalFetch=globalThis.fetch
const storageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage')
let values:Map<string,string>
beforeEach(()=>{
 values=new Map()
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)}})
 state.session=undefined
 globalThis.fetch=async()=>new Response(JSON.stringify({applicationId:'repair-app',apiBase:'/api',allowedHostOrigins:[],title:'报事报修'}))
})
afterEach(()=>{
 globalThis.fetch=originalFetch
 if(storageDescriptor)Object.defineProperty(globalThis,'sessionStorage',storageDescriptor)
 else Reflect.deleteProperty(globalThis,'sessionStorage')
})
test('old SaaS project login cache is removed rather than silently reused',async()=>{
 values.set('repair-h5:session',JSON.stringify({token:'saas-project-token',tenantDomain:'CQHT',applicationId:'repair-app'}))
 await initializeConfig()
 assert.equal(state.session,undefined);assert.equal(values.has('repair-h5:session'),false)
})
test('an application session restores its user-entered project without a built-in project config',async()=>{
 const session={token:'application-token',tenantDomain:'CQHT',applicationId:'repair-app'}
 values.set('repair-h5:application-session',JSON.stringify(session))
 await initializeConfig();assert.deepEqual(state.session,session)
})
test('sessions for another app or without a project code are not restored',async()=>{
 for(const session of [{token:'token',tenantDomain:'CQHT',applicationId:'other-app'},{token:'token',tenantDomain:' ',applicationId:'repair-app'}]){
  values.set('repair-h5:application-session',JSON.stringify(session))
  await initializeConfig();assert.equal(state.session,undefined)
 }
})
