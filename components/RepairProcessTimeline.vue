<template>
  <a-timeline>
    <a-timeline-item v-for="item in records" :key="item.id">
      <div>{{formatTime(item.createTime)}} · {{item.actorName}} · {{actionNames[item.action]||item.action}}</div>
      <div style="white-space:pre-wrap">{{item.description}}</div>
      <template v-if="item.details">
        <div v-if="item.details.reason">{{$t('ReportRepair.reason')}}{{item.details.reason}}</div>
        <div v-if="item.details.reply">{{$t('ReportRepair.replyPrefix')}}{{item.details.reply}}</div>
        <div v-if="item.details.delayUntil">{{$t('ReportRepair.requestedExtensionTo')}}{{formatTime(item.details.delayUntil)}}</div>
        <div v-if="item.details.callbackMethod">{{$t('ReportRepair.callbackHistory', {method:callbackMethodNames[item.details.callbackMethod]||item.details.callbackMethod,result:callbackResultNames[item.details.callbackResult||'']||item.details.callbackResult||'—',person:item.details.callbackPerson||'—',time:formatTime(item.details.callbackTime)})}}</div>
        <div v-if="item.details.satisfaction!==undefined">{{$t('ReportRepair.satisfactionHistory', {name:item.details.satisfactionName||'',score:item.details.satisfaction})}}</div>
        <div v-if="item.details.evaluationLabelNames?.length">{{$t('ReportRepair.ratingTags363')}}{{item.details.evaluationLabelNames.join('、')}}</div>
        <div v-if="item.details.ownerName">{{$t('ReportRepair.ownerHistory', {name:item.details.ownerName,phone:item.details.ownerPhone||'—',recorder:item.actorName})}}</div>
        <div v-if="item.action==='quote'">{{$t('ReportRepair.costHistory', {material:item.details.materialAmount,labor:item.details.artificialAmount})}}</div>
        <RepairAttachments v-if="item.details.signatureFileId" :value="[item.details.signatureFileId]" disabled />
      </template>
      <RepairAttachments v-if="item.attachmentIds?.length" :value="item.attachmentIds" disabled />
    </a-timeline-item>
  </a-timeline>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { callbackMethodNames, callbackResultNames } from '../services/actions'
import type { Process } from '../types'
import { actionNames, formatTime } from '../utils'
import RepairAttachments from './RepairAttachments.vue'
const { t: $t } = useI18n()
defineProps<{records:Process[]}>()
</script>
