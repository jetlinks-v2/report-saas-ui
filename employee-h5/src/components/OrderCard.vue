<script setup lang="ts">
import type {Order} from '../types'
import {time,reviewNames,actionNames} from '../services/labels'
import StatusTag from './StatusTag.vue'
defineProps<{order:Order;actions?:string[]}>()
defineEmits<{open:[order:Order];action:[order:Order,action:string]}>()
</script>
<template>
 <article class="order-card">
  <div class="card-heading"><span class="category-tag">{{order.categoryName||'未分类'}}</span><StatusTag :status="order.status" /></div>
  <a-button type="link" class="order-open" @click="$emit('open',order)">{{order.number}}</a-button>
  <dl class="order-fields">
   <dt>报事项目</dt><dd>{{order.businessProjectName}}</dd>
   <dt>报事描述</dt><dd class="line-clamp">{{order.description||order.title}}</dd>
   <dt>报事位置</dt><dd>{{[order.spaceName,order.location].filter(Boolean).join(' · ')||'—'}}</dd>
   <dt>报事时间</dt><dd>{{time(order.createTime)}}</dd>
   <dt>报事人</dt><dd>{{order.contactName}}<span v-if="order.paid" class="paid-badge">有偿</span></dd>
   <dt>责任人</dt><dd>{{order.assignedUserName||'待分派'}}</dd>
   <template v-if="order.reviewKind"><dt>审核类型</dt><dd>{{reviewNames[order.reviewKind]}}</dd><dt>申请原因</dt><dd>{{order.reviewReason||'—'}}</dd></template>
  </dl>
  <div class="card-actions"><a-button size="small" @click="$emit('open',order)">详情</a-button><a-button v-for="action in actions" :key="action" size="small" :type="action==='dispatch'?'default':'primary'" :class="{ 'outline-primary':action==='dispatch'}" @click="$emit('action',order,action)">{{actionNames[action]}}</a-button></div>
 </article>
</template>
