import { getModuleRoutesMap } from '@jetlinks-web/utils'
import { defineAsyncComponent } from 'vue'
import { RouteSecurityLevel, type ModuleRouteOverride } from '@jetlinks-web-core/router/types'
const views = import.meta.glob('./views/**/index.vue')
export default {
  getAsyncRoutesMap: () => getModuleRoutesMap(views),
  getRegisterComponents: () => [{
    targetPage: 'layout', targetModule: 'headerRight', mode: 'append', code: 'repair-order-sound',
    component: defineAsyncComponent(() => import('./components/OrderSoundReminder.vue')),
  }],
  getCoreRouteOverrides: ():ModuleRouteOverride[] => [{
    name:'repair-public-intake',path:'/public/repair/:code',component:()=>import('./views/repair/Public/index.vue'),
    meta:{security:RouteSecurityLevel.PUBLIC,skipMenuFetch:true,hideInMenu:true,title:'报事报修'}
  }]
}
