# 报事报修前端

仓库：`jetlinks-v2/report-saas-ui`，开发分支：`2.20`。根目录是 Cloud PC 报修模块；`employee-h5/` 是员工手机端独立应用。

## Cloud PC 接入

主工程为 `jetlinks-v2/saas-runtime-ui` 的 `property/2.20-dev`，通过 Git 子模块固定本仓库提交，路径保持 `modules/report-repair-ui`，模块名仍为 `report-repair-ui`。

```sh
git clone --branch property/2.20-dev --recurse-submodules git@github.com:jetlinks-v2/saas-runtime-ui.git
cd saas-runtime-ui
pnpm install --frozen-lockfile
pnpm dev
```

在主工程根目录执行模块构建与类型检查：

```sh
pnpm -F jetlinks-web-core build -- --module-name report-repair-ui
pnpm exec vue-tsc --noEmit -p modules/report-repair-ui/tsconfig.json
```

`index.ts` 和独立构建的 `register.ts` 使用同一注册入口，包含应用页面、匿名二维码路由与工单提示音扩展。PC 类型检查排除独立 H5，H5 按自己的依赖和 tsconfig 验证。主工程工作区配置同样排除 H5 包，避免两套 Vue 依赖混用。

后端为 `jetlinks-v2/property-management` 的 `2.20`，独立报修服务通过网关提供 `/repair/**`，基础服务提供 `/property/**`。两个服务须同时启动；项目、用户身份和空间绑定以基础模块为准，PC 与 H5 共用。菜单模板位于后端 `deploy/repair`，新环境需配置应用模板、订阅快照与角色授权。

## 员工 H5

```sh
cd employee-h5
npm ci
npm run build
docker compose -f compose.yml up -d --build
```

先修改 `employee-h5/public/config.json` 的租户编码、应用 ID 和宿主来源；Nginx 默认连接同 Docker 网络中的 Cloud 网关。网关服务名不同时修改 `employee-h5/nginx.conf`；网络名通过 `CLOUD_DOCKER_NETWORK` 配置。详见 [员工 H5 说明](employee-h5/README.md)。

## 模块能力

通过应用模板菜单的 `options.meta.componentCode` 注册页面：`repair/Orders` 工单处置、`repair/Overview` 状态概览、`repair/Configuration` 渠道/分类/等级等配置（按既有菜单路径选择页面）、`repair/Reports` 报表和评价查询、`repair/Exports` 导出记录。系统管理在本模块独立实现，五个页面位于 `views/system-management`，使用 `baseMenu.json` 中的 `system-management/*` 组件编码及 `/repair/system/*` 路由。既有报修菜单 ID 和 URL 保持不变，旧公共资料菜单应隐藏。新增菜单需要同步到应用模板、服务套餐、项目订阅和角色，保留原资产授权。

页面使用现有应用访问上下文与公共上传组件；服务端执行租户、应用、资产和动作权限。工单列表分页，详情使用抽屉查看及执行动作，处理过程使用时间线。基础资料从 Cloud 同步到基础模块，系统管理通过 `/property/**` 维护组织类型、用户身份、空间绑定与档案。

当前页面已接入延期/废弃/非正常关单与等级审核、转派/抢单、回访、双侧评价、签字、有偿费用和报表导出。业主评价/签字由员工后台代登记，业主信息与登记员工分开显示。Cloud 站内通知已接入原生消息中心；匿名二维码配置与公开表单、受限上传和提交已接通。其他通知渠道、业主本人入口和查验联动仍按约定边界处理；设备与第三方开放接口本轮暂不接入；不能把菜单预览作为已迁移的业务能力。工程构建、API 和浏览器验收由后端项目与本地验证记录统一说明。

模块包含独立构建需要的 `register.ts`、`baseMenu.ts` 与 `baseMenu.json`。`baseMenu.json` 提供系统管理菜单定义，既有报修菜单继续使用后端部署模板；实际授权统一由应用模板、服务套餐与角色维护。配置按业务项目筛选；切换发起项目时清空已选分类、渠道和空间。派单选项从后端目标工单的候选人接口读取，不以员工目录直接作为维修员列表。模块可独立构建；全工作区类型检查仍可能报告既有共享核心及依赖错误。

新增页面目录后应重启9200的Vite开发进程，使import.meta.glob收集新路由。角色待接单池允许具备接单权限的候选人在详情中发起接单；实际角色及资产资格由后端实时判定。

处理弹窗按旧表单接入 Ant Design Form 校验，完成表单保留正常/非正常关单类型、节点回复语与原字数限制。有偿签字后显示签字前完成情况、回复语、附件、费用和签字；回访返工或归档审核驳回后恢复完成内容编辑。后端复用可信过程记录并再次校验，前端禁用控件不是唯一保护。

报表联动按旧版恢复：报事统计、节点统计的项目名称和数量跳转报事记录，沿用项目、状态及原筛选。统一使用 ConditionFilter 的 `q` 路由编码，保留应用上下文，并支持刷新与浏览器返回恢复条件。

概览的报事总数进入全部记录，项目名称按业务项目ID钻取；项目表支持报事数排序和4/8/12条分页。共享筛选中的“与我相关”由服务端按本人登记、当前或历史责任人、参与记录及获授权的接单/回访候选池展开，列表、统计和导出共用同一权限范围。户均报事率随业主房屋资料后续迁移。

工单表格按旧版列序展示报事时间、编号、项目、状态、分类、描述、房屋、有偿金额、来源、位置、完成时限、紧急程度和等级；详情补登记人及处理时间。首次跟进通过统一附件控件上传到场照片，不再重复展示照片与附件两个上传入口。

报事列表提供旧版顺序的状态页签，计数保留搜索条件与业务项目、排除当前快捷状态。导出弹窗区分全部与当前条件，生成真实导出管理记录。详情按旧权限和状态提供打印预览；只打印工单区域，并保留旧表单字段，处理单位取已确认的业务项目组织。打印文本使用Vue插值转义，打印文档不携带平台导航或认证信息。

二维码配置位于既有配置目录，通过模板绑定 `repair/Configuration`；公开入口 `/#/public/repair/:code` 显式跳过菜单获取。空间范围按Cloud空间树配置节点及下级，公开表单仅显示二维码允许范围。新增菜单须同时加入订阅套餐并刷新目标项目订阅快照，仅修改模板和角色会导致租户菜单交集过滤及404。

报事等级页复用既有菜单入口，内部分派到`Configuration/Levels.vue`及`useLevelConfiguration`，采用旧版列表、内联表单和流程预览。其他配置由`Configuration/General.vue`呈现，保存统一校验已注册的Form字段。抽佣无单独名称，每项目一份、六项比例分别填写并展示，新增值留空、输入两位小数；既有存储精度保留。
