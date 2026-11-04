<template>
  <section class="repair-print-sheet">
    <h2>报事报修工单</h2>
    <table>
      <tbody>
        <tr><th>项目名称</th><td>{{ order.businessProjectName }}</td><th>报事时间</th><td>{{ formatTime(order.createTime) }}</td><th>报事单号</th><td>{{ order.number }}</td></tr>
        <tr><th>房屋信息</th><td>{{ order.spaceName || '—' }}</td><th>报事人</th><td>{{ order.contactName }}</td><th>联系电话</th><td>{{ order.contactPhone }}</td></tr>
        <tr><th>处理单位</th><td colspan="2">{{ order.businessProjectName }}</td><th>处理人员</th><td colspan="2">{{ order.assignedUserName || '—' }}</td></tr>
        <tr><th>报事内容</th><td colspan="5">{{ order.description }}</td></tr>
        <tr><th>派工时间</th><td colspan="2">{{ formatTime(dispatchTime) }}</td><th>完成时间</th><td colspan="2">{{ formatTime(order.finishTime) }}</td></tr>
        <tr><th>处理结果</th><td colspan="5"><div v-for="item in completion" :key="item.id">{{ item.description }}</div></td></tr>
        <tr><th>服务评价</th><td colspan="5">{{ evaluation?.details?.satisfactionName || '—' }}<template v-if="evaluation?.details?.satisfaction !== undefined">（{{ evaluation.details.satisfaction }}分）</template><div v-if="evaluation?.details?.evaluationLabelNames?.length">{{ evaluation.details.evaluationLabelNames.join('、') }}</div></td></tr>
        <tr><th>评价时间</th><td colspan="5">{{ formatTime(evaluation?.createTime) }}</td></tr>
        <tr><th>评价内容</th><td colspan="5">{{ evaluation?.description || '—' }}</td></tr>
        <tr class="signature"><th>业主签字</th><td colspan="5"></td></tr>
      </tbody>
    </table>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { Order, Process, Review } from '../types'
import { formatTime } from '../utils'
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
