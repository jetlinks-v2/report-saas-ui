import type { MenuFilterDefinition, MenuItem } from '@jetlinks-web-core/types/module'
import { isProjectApplicationScope } from '@jetlinks-web-core/utils/application-scope'

// 复用旧系统根节点标识，已有菜单、按钮和数据授权不换 ID。
export const REPAIR_ROOT_MENU_ID = 'repair-95ba1c0107da4cfe928acf91df0197ae'
const isRepairRoot = (menu: MenuItem) => menu.code === REPAIR_ROOT_MENU_ID

/** 只展开独立应用的已授权根节点；项目导航与权限编辑继续使用完整分组树。 */
export const repairMenuFilter: MenuFilterDefinition = {
  code: 'repair-application-navigation',
  filter(menus, { applicationScope }) {
    if (!applicationScope?.trim() || isProjectApplicationScope(applicationScope)) return menus

    return menus.flatMap(menu => {
      if (!isRepairRoot(menu)) return [menu]
      // 公共基础菜单由 property-base-ui 独立提供，不补充未授权子项。
      return menu.children || []
    })
  },
}
