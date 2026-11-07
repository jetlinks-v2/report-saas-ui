<script setup lang="ts">
import {reactive,ref,computed} from 'vue'
import dayjs from 'dayjs'
import {CalendarOutlined,DownOutlined,ArrowRightOutlined,ClockCircleOutlined,AccountBookOutlined,AuditOutlined,AlertOutlined,UserOutlined,ToolOutlined,ReloadOutlined} from '@ant-design/icons-vue'
import {useHome} from '../hooks/useHome'
import {can} from '../services/session'
import {name} from '../services/labels'
const vm=reactive(useHome()),dateOpen=ref(false),projectOpen=ref(false)
const draftStart=ref(vm.start),draftEnd=ref(vm.end)
const projectName=computed(()=>name(vm.projects.find(p=>p.id===vm.state.projectId)||{})||'全部授权项目')
function openDate(){draftStart.value=vm.start;draftEnd.value=vm.end;dateOpen.value=true}
function applyDate(){vm.start=draftStart.value;vm.end=draftEnd.value;dateOpen.value=false;void vm.load()}
const metricItems=[
 {mode:'unfinished',label:'未完成报事',key:'unfinished',hint:'持续跟进处理',icon:ClockCircleOutlined},
 {mode:'paid',label:'有偿报事',key:'paid',hint:'查看有偿服务',icon:AccountBookOutlined},
 {mode:'review',label:'报事审核',key:'audit',hint:'查看待审申请',icon:AuditOutlined},
 {mode:'warning',label:'物业预警',key:'warning',hint:'关注时限提醒',icon:AlertOutlined},
] as const
const dateValid=computed(()=>draftStart.value&&draftEnd.value&&draftStart.value<=draftEnd.value)
</script>
<template>
 <section class="home-page">
  <header class="home-nav"><span class="header-side brand-icon"><ToolOutlined aria-hidden="true" /></span><a-button type="text" class="community-switch" @click="projectOpen=true">{{projectName}} <DownOutlined aria-hidden="true" /></a-button><router-link to="/profile" class="header-side" aria-label="我的"><UserOutlined /></router-link></header>
  <div class="home-content">
   <div class="home-greeting"><h1>{{vm.state.authorization?.user.name||vm.state.authorization?.user.username||'员工'}}，您好</h1><p>用心服务，让每一处问题都有回应</p></div>
   <router-link v-if="can('create')" class="repair-banner" to="/create">
    <img class="banner-background" src="/images/report/summary-bg-mp.png" alt="" />
    <div class="banner-copy"><span class="eyebrow">报事报修 · 员工工作台</span><h2>现场发现，及时报事</h2><p>记录问题，让服务即刻开始</p><span class="banner-action">发起报事 <ArrowRightOutlined aria-hidden="true" /></span></div>
    <img class="repair-art" src="/images/report/repair-toolkit.svg" alt="" fetchpriority="high" />
   </router-link>
   <div class="section-heading"><h2>报事概览</h2><a-button type="text" size="small" :loading="vm.loading" @click="vm.load"><ReloadOutlined aria-hidden="true" />刷新</a-button></div>
   <a-button type="text" class="date-row" @click="openDate"><CalendarOutlined aria-hidden="true" /><span>{{vm.start}} 至 {{vm.end}}</span><DownOutlined aria-hidden="true" /></a-button>
   <a-alert v-if="vm.error" :message="vm.error" type="error" show-icon><template #action><a-button size="small" @click="vm.load">重试</a-button></template></a-alert>
   <a-spin :spinning="vm.loading"><template v-if="vm.metrics">
    <router-link class="summary-panel" :to="{path:'/orders',query:{mode:'pool',start:vm.start,end:vm.end}}">
     <div><span>报事量 <ArrowRightOutlined aria-hidden="true" /></span><strong>{{vm.metrics.total}}</strong><small>所选日期内的报事</small></div><div><span>报事完成率</span><strong>{{vm.completionRate}}<em>%</em></strong><small>已完成 / 有效报事</small></div>
    </router-link>
    <div class="metric-grid">
     <router-link v-for="item in metricItems" :key="item.mode" class="metric" :to="{path:'/orders',query:{mode:item.mode,start:vm.start,end:vm.end}}"><i><component :is="item.icon" aria-hidden="true" /></i><div><span>{{item.label}}</span><strong>{{vm.metrics[item.key]}}</strong><small>{{item.hint}}</small></div><ArrowRightOutlined class="metric-arrow" aria-hidden="true" /></router-link>
    </div>
   </template><a-skeleton v-else-if="vm.loading" active /></a-spin>
  </div>
  <a-drawer v-model:open="projectOpen" title="选择业务项目" placement="bottom" height="auto" class="mobile-drawer"><a-select v-model:value="vm.state.projectId" aria-label="当前业务项目" allow-clear show-search option-filter-prop="label" placeholder="全部授权项目" :options="vm.projects.map(p=>({value:p.id,label:name(p)}))" style="width:100%" /><a-button type="primary" block class="drawer-confirm" @click="projectOpen=false">确定</a-button></a-drawer>
  <a-drawer v-model:open="dateOpen" title="统计日期" placement="bottom" height="auto" class="mobile-drawer"><a-form layout="vertical"><a-form-item label="开始日期"><a-date-picker :value="dayjs(draftStart)" :allow-clear="false" format="YYYY-MM-DD" @update:value="draftStart=$event!.format('YYYY-MM-DD')" /></a-form-item><a-form-item label="结束日期"><a-date-picker :value="dayjs(draftEnd)" :allow-clear="false" format="YYYY-MM-DD" @update:value="draftEnd=$event!.format('YYYY-MM-DD')" /></a-form-item></a-form><a-button type="primary" block :disabled="!dateValid" @click="applyDate">确定</a-button></a-drawer>
 </section>
</template>
