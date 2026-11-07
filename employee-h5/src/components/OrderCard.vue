<script setup lang="ts">
import type {Order} from '../types'
import {EnvironmentOutlined,ClockCircleOutlined,UserOutlined,TeamOutlined,ApartmentOutlined,AuditOutlined,FileTextOutlined,ArrowRightOutlined} from '@ant-design/icons-vue'
import {time,reviewNames,actionNames} from '../services/labels'
import StatusTag from './StatusTag.vue'
defineProps<{order:Order;actions?:string[]}>()
defineEmits<{open:[order:Order];action:[order:Order,action:string]}>()
</script>
<template>
 <article class="order-card">
  <div class="card-heading"><span class="category-tag">{{order.categoryName||'未分类'}}</span><StatusTag :status="order.status" /></div>
  <span class="order-code">{{order.number}}</span>
  <a-button type="link" class="order-open line-clamp" @click="$emit('open',order)">{{order.description||order.title||'查看报事详情'}}</a-button>
  <dl class="order-fields">
   <dt><ApartmentOutlined aria-hidden="true" />报事项目</dt><dd>{{order.businessProjectName}}</dd>
   <dt><EnvironmentOutlined aria-hidden="true" />报事位置</dt><dd>{{[order.spaceName,order.location].filter(Boolean).join(' · ')||'—'}}</dd>
   <dt><ClockCircleOutlined aria-hidden="true" />报事时间</dt><dd>{{time(order.createTime)}}</dd>
   <dt><UserOutlined aria-hidden="true" />报事人</dt><dd>{{order.contactName}}<span v-if="order.paid" class="paid-badge">有偿</span></dd>
   <dt><TeamOutlined aria-hidden="true" />责任人</dt><dd>{{order.assignedUserName||'待分派'}}</dd>
   <template v-if="order.reviewKind"><dt><AuditOutlined aria-hidden="true" />审核类型</dt><dd>{{reviewNames[order.reviewKind]}}</dd><dt><FileTextOutlined aria-hidden="true" />申请原因</dt><dd>{{order.reviewReason||'—'}}</dd></template>
  </dl>
  <div class="card-actions"><a-button size="small" @click="$emit('open',order)">详情 <ArrowRightOutlined aria-hidden="true" /></a-button><a-button v-for="action in actions" :key="action" size="small" :type="action==='dispatch'?'default':'primary'" :class="{ 'outline-primary':action==='dispatch'}" @click="$emit('action',order,action)">{{actionNames[action]}}</a-button></div>
 </article>
</template>
