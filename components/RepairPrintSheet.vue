<template>
  <section class="repair-print-sheet">
    <h2>{{$t('ReportRepair.issueAndRepairOrder')}}</h2>
    <table>
      <tbody>
        <tr><th>{{$t('ReportRepair.projectName')}}</th><td>{{ order.businessProjectName }}</td><th>{{$t('ReportRepair.reported')}}</th><td>{{ formatTime(order.createTime) }}</td><th>{{$t('ReportRepair.printIssueNumber')}}</th><td>{{ order.number }}</td></tr>
        <tr><th>{{$t('ReportRepair.houseInformation')}}</th><td>{{ order.spaceName || '—' }}</td><th>{{$t('ReportRepair.reportedBy')}}</th><td>{{ order.contactName }}</td><th>{{$t('ReportRepair.phone')}}</th><td>{{ order.contactPhone }}</td></tr>
        <tr><th>{{$t('ReportRepair.serviceOrganization')}}</th><td colspan="2">{{ order.businessProjectName }}</td><th>{{$t('ReportRepair.serviceStaff')}}</th><td colspan="2">{{ order.assignedUserName || '—' }}</td></tr>
        <tr><th>{{$t('ReportRepair.issueContent')}}</th><td colspan="5">{{ order.description }}</td></tr>
        <tr><th>{{$t('ReportRepair.assigned')}}</th><td colspan="2">{{ formatTime(dispatchTime) }}</td><th>{{$t('ReportRepair.completed')}}</th><td colspan="2">{{ formatTime(order.finishTime) }}</td></tr>
        <tr><th>{{$t('ReportRepair.handlingResult')}}</th><td colspan="5"><div v-for="item in completion" :key="item.id">{{ item.description }}</div></td></tr>
        <tr><th>{{$t('ReportRepair.serviceRating')}}</th><td colspan="5">{{ evaluation?.details?.satisfactionName || '—' }}<template v-if="evaluation?.details?.satisfaction !== undefined">{{$t('ReportRepair.scoreOnly', {score:evaluation.details.satisfaction})}}</template><div v-if="evaluation?.details?.evaluationLabelNames?.length">{{ evaluation.details.evaluationLabelNames.join('、') }}</div></td></tr>
        <tr><th>{{$t('ReportRepair.rated')}}</th><td colspan="5">{{ formatTime(evaluation?.createTime) }}</td></tr>
        <tr><th>{{$t('ReportRepair.ratingComments')}}</th><td colspan="5">{{ evaluation?.description || '—' }}</td></tr>
        <tr class="signature"><th>{{$t('ReportRepair.ownerSignature')}}</th><td colspan="5"></td></tr>
      </tbody>
    </table>
  </section>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { Order, Process, Review } from '../types'
import { formatTime } from '../utils'
const { t: $t } = useI18n()
const props = defineProps<{ order: Order; history: Process[]; reviews: Review[] }>()
const dispatchTime = computed(() => props.history.find(row => ['dispatch', 'transfer', 'grab'].includes(row.action))?.createTime)
const evaluation = computed(() => props.history.find(row => row.action === 'evaluate'))
const completion = computed(() => props.history.filter(row => row.action === 'finish' ||
  (row.action === 'review' && props.reviews.some(review => review.id === row.details?.reviewId && review.kind === 'close' && review.status === 2))))
</script>
<style scoped>
.repair-print-sheet { color: #000; background: #fff; padding: 12px; }
h2 { text-align: center; font-size: 20px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; }
th, td { border: 1px solid #000; padding: 8px; white-space: pre-wrap; overflow-wrap: anywhere; }
th { width: 14%; text-align: left; }
.signature { height: 48px; }
</style>
