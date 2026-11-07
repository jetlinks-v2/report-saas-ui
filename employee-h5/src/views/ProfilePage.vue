<script setup lang="ts">
import {reactive} from 'vue'
import {RightOutlined,CarryOutOutlined,TeamOutlined,AuditOutlined,AlertOutlined,SafetyCertificateOutlined,LogoutOutlined} from '@ant-design/icons-vue'
import {state} from '../services/session'
import {useSession} from '../hooks/useSession'
const vm=reactive(useSession())
const links=[
 {mode:'todo',label:'我的待办',hint:'及时处理当前任务',icon:CarryOutOutlined},
 {mode:'related',label:'与我相关的工单',hint:'查看我参与的处理记录',icon:TeamOutlined},
 {mode:'review',label:'报事审核',hint:'查看报事审核申请',icon:AuditOutlined},
 {mode:'warning',label:'物业预警',hint:'关注即将超时的报事',icon:AlertOutlined},
]
</script>
<template>
 <section class="page profile-page">
  <div class="panel profile-panel"><img class="profile-art" src="/images/report/repair-records.svg" alt="" /><div class="avatar">{{(state.authorization?.user.name||state.authorization?.user.username||'员').slice(0,1)}}</div><h2>{{state.authorization?.user.name||state.authorization?.user.username}}</h2><p>项目编码：{{state.session?.tenantDomain}}</p><span class="profile-badge"><SafetyCertificateOutlined aria-hidden="true" />报事报修 · 员工工作台</span></div>
  <div class="panel profile-links">
   <router-link v-for="item in links" :key="item.mode" class="setting-row" :to="'/orders?mode='+item.mode"><i><component :is="item.icon" aria-hidden="true" /></i><span>{{item.label}}<small>{{item.hint}}</small></span><RightOutlined aria-hidden="true" /></router-link>
  </div>
  <a-alert v-if="vm.error" :message="vm.error" type="error" show-icon />
  <a-button block danger class="logout-button" :loading="vm.loading" @click="vm.logout"><LogoutOutlined aria-hidden="true" />退出登录</a-button>
 </section>
</template>
