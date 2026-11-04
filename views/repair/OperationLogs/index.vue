<template>
  <a-card title="操作日志">
    <template #extra><a-button :loading="loading" @click="load">刷新</a-button></template>
    <ConditionFilter v-model="terms" :fields="fields" @change="search" />
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin:16px 0" />
    <a-table :data-source="rows" :loading="loading" row-key="id" :scroll="{x:'max-content'}" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
      <a-table-column key="status" title="日志状态"><template #default="{record}"><a-tag :color="record.status===0?'green':'red'">{{record.status===0?'正常':'异常'}}</a-tag></template></a-table-column>
      <a-table-column key="operatorName" title="操作人" data-index="operatorName" />
      <a-table-column key="operatorId" title="操作人编号" data-index="operatorId" />
      <a-table-column key="action" title="操作类型" data-index="action" />
      <a-table-column key="operation" title="操作行为" data-index="operation" />
      <a-table-column key="url" title="请求接口"><template #default="{record}">{{record.httpMethod}} {{record.url}}</template></a-table-column>
      <a-table-column key="createTime" title="操作时间"><template #default="{record}">{{formatTime(record.createTime)}}</template></a-table-column>
      <a-table-column key="duration" title="耗时"><template #default="{record}">{{record.duration}} ms</template></a-table-column>
      <a-table-column key="errorType" title="异常类型" data-index="errorType" />
    </a-table>
  </a-card>
</template>
<script setup lang="ts">
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import { useOperationLogs } from '../../../hooks/useOperationLogs'
import { formatTime } from '../../../utils'
const {fields,terms,rows,total,current,loading,error,load,search,pageChange}=useOperationLogs()
</script>
