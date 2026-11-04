import {createApp} from 'vue'
import {createRouter,createWebHashHistory} from 'vue-router'
import Antd from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {ConfigProvider} from 'ant-design-vue'
import {h} from 'vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'
import {attachHostBridge,clearSession,initializeConfig,state} from './services/session'
import {verifySession} from './hooks/useSession'

const router=createRouter({history:createWebHashHistory(),routes:[
 {path:'/',component:()=>import('./views/HomePage.vue')},{path:'/login',component:()=>import('./views/LoginPage.vue')},
 {path:'/orders',component:()=>import('./views/OrderListPage.vue')},{path:'/orders/:id',component:()=>import('./views/OrderDetailPage.vue')},
 {path:'/orders/:id/action/:action',component:()=>import('./views/ActionPage.vue')},{path:'/create',component:()=>import('./views/CreatePage.vue')},
 {path:'/profile',component:()=>import('./views/ProfilePage.vue')},{path:'/:pathMatch(.*)*',redirect:'/'},
]})
dayjs.locale('zh-cn')
async function bootstrap(){
 await initializeConfig()
 router.beforeEach(async to=>{
  if(to.path==='/login')return true
  if(!state.session)return'/login'
  if(!state.authorization){try{await verifySession()}catch{clearSession();return'/login'}}
  return true
 })
 attachHostBridge(async()=>{try{await verifySession();await router.replace('/')}catch{clearSession();await router.replace('/login')}})
 window.addEventListener('repair:session-expired',()=>void router.replace('/login'))
 createApp({render:()=>h(ConfigProvider,{locale:zhCN,theme:{token:{colorPrimary:'#1677FF',colorInfo:'#1677FF',borderRadius:8,fontSize:14,controlHeight:44}}},()=>h(App))}).use(Antd).use(router).mount('#app')
}
void bootstrap().catch(()=>{document.getElementById('app')!.textContent='应用配置加载失败，请刷新重试。'})
