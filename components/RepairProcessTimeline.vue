<template>
  <a-timeline>
    <a-timeline-item v-for="item in records" :key="item.id">
      <div>{{formatTime(item.createTime)}} · {{item.actorName}} · {{actionNames[item.action]||item.action}}</div>
      <div style="white-space:pre-wrap">{{item.description}}</div>
      <template v-if="item.details">
        <div v-if="item.details.reason">原因：{{item.details.reason}}</div>
        <div v-if="item.details.reply">回复语：{{item.details.reply}}</div>
        <div v-if="item.details.delayUntil">申请延期至：{{formatTime(item.details.delayUntil)}}</div>
        <div v-if="item.details.callbackMethod">回访方式：{{item.details.callbackMethod}}；结果：{{item.details.callbackResult}}；回访人：{{item.details.callbackPerson}}；时间：{{formatTime(item.details.callbackTime)}}</div>
        <div v-if="item.details.satisfaction!==undefined">满意度：{{item.details.satisfactionName||''}}（{{item.details.satisfaction}}分）</div>
        <div v-if="item.details.evaluationLabelNames?.length">评价标签：{{item.details.evaluationLabelNames.join('、')}}</div>
        <div v-if="item.details.ownerName">业主：{{item.details.ownerName}}；联系方式：{{item.details.ownerPhone}}；登记人：{{item.actorName}}</div>
        <div v-if="item.action==='quote'">材料费：{{item.details.materialAmount}} 元；人工费：{{item.details.artificialAmount}} 元</div>
        <RepairAttachments v-if="item.details.signatureFileId" :value="[item.details.signatureFileId]" disabled />
      </template>
      <RepairAttachments v-if="item.attachmentIds?.length" :value="item.attachmentIds" disabled />
    </a-timeline-item>
  </a-timeline>
</template>
<script setup lang="ts">
import type { Process } from '../types'
import { actionNames, formatTime } from '../utils'
import RepairAttachments from './RepairAttachments.vue'
defineProps<{records:Process[]}>()
</script>
