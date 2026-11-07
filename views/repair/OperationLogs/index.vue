<template>
  <a-card :title="$t('ReportRepair.operationLogs')">

    <ConditionFilter v-model="terms" :fields="fields" @change="search" />
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin:16px 0" />
    <a-table :data-source="rows" :loading="loading" row-key="id" :scroll="{x:'max-content'}" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
      <a-table-column key="status" :title="$t('ReportRepair.logStatus')"><template #default="{record}"><a-tag :color="record.status===0?'green':'red'">{{record.status===0?$t('ReportRepair.normal'):$t('ReportRepair.error')}}</a-tag></template></a-table-column>
      <a-table-column key="operatorName" :title="$t('ReportRepair.operator')" data-index="operatorName" />
      <a-table-column key="operatorId" :title="$t('ReportRepair.operatorID')" data-index="operatorId" />
      <a-table-column key="action" :title="$t('ReportRepair.operationType')" data-index="action" />
      <a-table-column key="operation" :title="$t('ReportRepair.operation')" data-index="operation" />
      <a-table-column key="url" :title="$t('ReportRepair.requestEndpoint')"><template #default="{record}">{{record.httpMethod}} {{record.url}}</template></a-table-column>
      <a-table-column key="createTime" :title="$t('ReportRepair.operationTime')"><template #default="{record}">{{formatTime(record.createTime)}}</template></a-table-column>
      <a-table-column key="duration" :title="$t('ReportRepair.duration')"><template #default="{record}">{{record.duration}} ms</template></a-table-column>
      <a-table-column key="errorType" :title="$t('ReportRepair.exceptionType')" data-index="errorType" />
    </a-table>
  </a-card>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import { useOperationLogs } from '../../../hooks/useOperationLogs'
import { formatTime } from '../../../utils'
const { t: $t } = useI18n()
const {fields,terms,rows,total,current,loading,error,load,search,pageChange}=useOperationLogs()
</script>