import i18n from '@jetlinks-web-core/locales'
import { getModuleRoutesMap } from '@jetlinks-web/utils'
import { defineAsyncComponent } from 'vue'
import { RouteSecurityLevel, type ModuleRouteOverride } from '@jetlinks-web-core/router/types'
import { repairMenuFilter } from './services/menuNavigation'
const { t } = i18n.global
const views = import.meta.glob('./views/**/index.vue')
export default {
  getAsyncRoutesMap: () => getModuleRoutesMap(views),
  getMenuFilters: () => [repairMenuFilter],
  getRegisterComponents: () => [{
    targetPage: 'layout', targetModule: 'headerRight', mode: 'append', code: 'repair-order-sound',
    component: defineAsyncComponent(() => import('./components/OrderSoundReminder.vue')),
  }],
  getCoreRouteOverrides: ():ModuleRouteOverride[] => [{
    name:'repair-public-intake',path:'/public/repair/:code',component:()=>import('./views/repair/Public/index.vue'),
    meta:{security:RouteSecurityLevel.PUBLIC,skipMenuFetch:true,hideInMenu:true,title:t('ReportRepair.issuesAndRepairs')}
  }]
}
