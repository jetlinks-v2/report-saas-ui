# 报事报修前端

仓库：`jetlinks-v2/report-saas-ui`，唯一开发主线为 `2.20`；各历史分支的已提交更新统一合入此分支，后续直接在此分支开发。本仓库仅维护 Cloud PC 报修模块。员工 H5 已迁至独立仓库 [report-repair-wx-ui](https://github.com/jetlinks-v2/report-repair-wx-ui)。

## Cloud PC 接入

主工程为 `jetlinks-v2/saas-runtime-ui` 的 `property/2.20-dev`，通过 Git 子模块固定本仓库 `2.20` 分支的提交，路径保持 `modules/report-repair-ui`，模块名仍为 `report-repair-ui`。

```sh
git clone --branch property/2.20-dev --recurse-submodules git@github.com:jetlinks-v2/saas-runtime-ui.git
cd saas-runtime-ui
pnpm install --frozen-lockfile
pnpm dev
```

在主工程根目录执行模块构建与类型检查：

```sh
pnpm --filter report-repair-ui build:with-base
pnpm exec vue-tsc --noEmit -p modules/report-repair-ui/tsconfig.json
```

`index.ts` 和独立构建的 `register.ts` 使用同一注册入口，包含应用页面、匿名二维码路由与工单提示音扩展。PC 与 H5 分仓维护，H5 使用 Vant 4，由统一移动外壳组合构建。

后端为 `jetlinks-v2/property-management` 的 `2.20`，独立报修服务通过网关提供 `/repair/**`，基础服务提供 `/property/**`。两个服务须同时启动；项目、用户身份和空间绑定以基础模块为准，PC 与 H5 共用。完整菜单定义维护在本仓库 `baseMenu.json`，由 `baseMenu.ts` 提供给宿主初始化；新环境仍需配置应用模板、订阅快照与角色授权。

## 员工 H5

独立源码：[report-repair-wx-ui](https://github.com/jetlinks-v2/report-repair-wx-ui)。保留账号密码登录调试入口；正式交付由 [cloud.jetlinks.mobile](https://github.com/jetlinks-v2/cloud.jetlinks.mobile) 组合 `repair-app` 构建，模板编码为 `ReportRepair`。

在移动主工程根目录执行 `pnpm install --frozen-lockfile`、`pnpm build:app repair-app`。真实租户、应用授权和请求由外壳提供，部署说明以移动主工程 `docs/mobile-app-modules.md` 为准。

## 模块能力

通过应用模板菜单的 `options.meta.componentCode` 注册页面：`repair/Orders` 工单处置、`repair/Overview` 状态概览、`repair/Configuration` 渠道/分类/等级等配置（按既有菜单路径选择页面）、`repair/Reports` 报表和评价查询、`repair/Exports` 导出记录。组织、用户、空间、客户和字典的菜单及页面由 `property-base-ui` 独立提供，报修只维护自身业务菜单，不复制或导入公共菜单和基础页面实现。既有报修业务菜单 ID 和 URL 保持不变。新增菜单需要同步到应用模板、服务套餐、项目订阅和角色，保留原资产授权。

页面使用现有应用访问上下文与公共上传组件；服务端执行租户、应用、资产和动作权限。工单列表分页，详情使用抽屉查看及执行动作，处理过程使用时间线。基础资料从 Cloud 同步到基础服务，公共基础前端通过 `/property/**` 维护组织类型、用户身份、空间绑定与档案。报修项目和空间选项经 `property-base-ui` 注册中心公开 API 获取；派单候选仍走报修业务接口。

当前页面已接入延期/废弃/非正常关单与等级审核、转派/抢单、回访、双侧评价、签字、有偿费用和报表导出。业主评价/签字由员工后台代登记，业主信息与登记员工分开显示。Cloud 站内通知已接入原生消息中心；匿名二维码配置与公开表单、受限上传和提交已接通。其他通知渠道、业主本人入口和查验联动仍按约定边界处理；设备与第三方开放接口本轮暂不接入；不能把菜单预览作为已迁移的业务能力。工程构建、API 和浏览器验收由后端项目与本地验证记录统一说明。

模块包含独立构建需要的 `register.ts`、`baseMenu.ts` 与 `baseMenu.json`。`baseMenu.json` 提供33个业务菜单定义，包含报修根节点、首页、处理、统计、配置及保留的历史节点。业务菜单保留原 ID、URL、组件编码、按钮、资产类型与中英文资源，`showPage` 按后端功能权限参与宿主初始化筛选，`baseMenu.ts` 递归补齐 `runtime` 和 `options.appName`。历史节点的隐藏状态和未授权范围保持原定义；实际授权由应用模板、服务套餐与角色维护。配置按业务项目筛选；切换发起项目时清空已选分类、渠道和空间。派单选项从后端目标工单的候选人接口读取，不以员工目录直接作为维修员列表。模块可独立构建；全工作区类型检查仍可能报告既有共享核心及依赖错误。 公共基础菜单由宿主扫描已加载的 `property-base-ui/baseMenu.ts` 获取，不在报修菜单内拼接。

## 菜单分组与应用导航

导航过滤器兼容原有“报事报修”根节点 `repair-95ba1c0107da4cfe928acf91df0197ae` 及其已授权业务分组，保留子菜单 ID、URL、组件编码、按钮和资产权限。公共基础管理菜单及页面由 `property-base-ui` 独立提供；报修不再提供原 `repair-system-*` 系统管理菜单或页面副本。

`index.ts` 通过宿主现有 `getMenuFilters` 注册 `services/menuNavigation.ts`。仅在独立应用上下文展开报修根节点一层，继续显示原有业务分组及二级页面；项目上下文和权限编辑树保留根节点。过滤器只处理服务端已授权的子项，不依据源码生成菜单，也不展开其他系统的根节点。

本仓库 `baseMenu.json` 是报修菜单定义的维护入口，后端 `deploy/repair` 保留部署授权交接材料。已有环境通过宿主菜单配置增量同步定义，再调整应用模板、套餐、项目订阅和角色；由平台维护树路径，保留原叶子、按钮和资产策略。根分组不增加业务权限。代码更新不会自动修改已持久化的菜单或授予业务权限。

新增页面目录后应重启9200的Vite开发进程，使import.meta.glob收集新路由。角色待接单池允许具备接单权限的候选人在详情中发起接单；实际角色及资产资格由后端实时判定。

处理弹窗按旧表单接入 Ant Design Form 校验，完成表单保留正常/非正常关单类型、节点回复语与原字数限制。有偿签字后显示签字前完成情况、回复语、附件、费用和签字；回访返工或归档审核驳回后恢复完成内容编辑。后端复用可信过程记录并再次校验，前端禁用控件不是唯一保护。

报表联动按旧版恢复：报事统计、节点统计的项目名称和数量跳转报事记录，沿用项目、状态及原筛选。统一使用 ConditionFilter 的 `q` 路由编码，保留应用上下文，并支持刷新与浏览器返回恢复条件。

概览的报事总数进入全部记录，项目名称按业务项目ID钻取；项目表支持报事数排序和4/8/12条分页。共享筛选中的“与我相关”由服务端按本人登记、当前或历史责任人、参与记录及获授权的接单/回访候选池展开，列表、统计和导出共用同一权限范围。户均报事率随业主房屋资料后续迁移。

工单表格按旧版列序展示报事时间、编号、项目、状态、分类、描述、房屋、有偿金额、来源、位置、完成时限、紧急程度和等级；详情补登记人及处理时间。首次跟进通过统一附件控件上传到场照片，不再重复展示照片与附件两个上传入口。

报事列表提供旧版顺序的状态页签，计数保留搜索条件与业务项目、排除当前快捷状态。导出弹窗区分全部与当前条件，生成真实导出管理记录。详情按旧权限和状态提供打印预览；只打印工单区域，并保留旧表单字段，处理单位取已确认的业务项目组织。打印文本使用Vue插值转义，打印文档不携带平台导航或认证信息。

二维码配置位于既有配置目录，通过模板绑定 `repair/Configuration`；公开入口 `/#/public/repair/:code` 显式跳过菜单获取。空间范围按Cloud空间树配置节点及下级，公开表单仅显示二维码允许范围。新增菜单须同时加入订阅套餐并刷新目标项目订阅快照，仅修改模板和角色会导致租户菜单交集过滤及404。

报事等级页复用既有菜单入口，内部分派到`Configuration/Levels.vue`及`useLevelConfiguration`，采用旧版列表、内联表单和流程预览。其他配置由`Configuration/General.vue`呈现，保存统一校验已注册的Form字段。抽佣无单独名称，每项目一份、六项比例分别填写并展示，新增值留空、输入两位小数；既有存储精度保留。

## 中英文切换

PC 报事报修沿用主工程 `vue-i18n` 与 `locales/lang/zh.json`、`en.json` 的自动加载机制，页面、处理表单、配置、统计、导出、打印及匿名二维码表单的固定文案统一放在 `ReportRepair` 命名空间。右上角切换语言会按主工程既有行为刷新页面；日期也随当前语言显示。菜单与按钮的中英文元数据维护在前端 `baseMenu.json`；旧环境保留的中文 `i18nName` 由语言包中的兼容入口解析。公共基础管理的中英文资源由 `property-base-ui` 维护，报修不再注册 `ReportSystem` 副本。用户录入的分类、项目、描述等业务数据保留原文，回访方式/结果提交值及后台渠道匹配不随语言改变。员工 H5 是独立应用，不属于 PC 右上角语言开关的范围。

## 公共基础前端

宿主须检出 `modules/property-base-ui`（`jetlinks-v2/property-base-ui` 的 `2.20`）。开发和聚合构建白名单包含 `report-repair-ui,property-base-ui`；`pnpm --filter report-repair-ui dev` 同时加载公共和认证模块。`build` 只输出独立报修模块包，`build:with-base` 输出宿主 `dist/`，实际 SaaS 发布继续与运行端、认证及所需业务模块一起构建。

公共基础模块维护一份公共菜单，根节点为 `charging/basic`，五个页面沿用 `charging/OrganizationType`、`charging/User`、`charging/Space`、`charging/Customer`、`charging/Dictionary`，后端权限仍为 `property-*`。报修 `baseMenu.json` 只维护自身业务菜单，宿主统一扫描两个模块的菜单定义。

已有环境需在菜单管理中清理旧 `repair-system-*`（编码为 `system-management/*`）菜单，并在应用模板、套餐、订阅和角色中配置公共基础菜单及所需资产范围。重新初始化不会自动删除旧菜单，代码更新也不会自动授予公共菜单权限。不修改基础表或业务数据。
