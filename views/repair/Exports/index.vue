<template>
 <a-card :title="$t('ReportRepair.exports')">
  <ConditionFilter v-model="terms" :fields="fields" @change="search" />
  <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
  <a-table :data-source="rows" :loading="loading" row-key="id" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
   <a-table-column key="name" :title="$t('ReportRepair.fileName')" data-index="name" />
   <a-table-column key="creator" :title="$t('ReportRepair.exportedBy')" data-index="creatorName" />
   <a-table-column key="time" :title="$t('ReportRepair.created')"><template #default="{record}">{{formatTime(record.createTime)}}</template></a-table-column>
   <a-table-column key="status" :title="$t('ReportRepair.status')"><template #default="{record}"><a-tag :color="record.status==='completed'?'green':record.status==='failed'?'red':'blue'">{{ statusNames[record.status] }}</a-tag></template></a-table-column>
   <a-table-column key="action" :title="$t('ReportRepair.actions')"><template #default="{record}"><a-button v-if="canDownload" type="link" :loading="downloading===record.id" :disabled="record.status!=='completed'" @click="download(record)">{{$t('ReportRepair.download')}}</a-button></template></a-table-column>
  </a-table>
 </a-card>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useExports } from '../../../hooks/useExports'
import { formatTime } from '../../../utils'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
const { t: $t } = useI18n()
const statusNames:Record<string,string>={processing:$t('ReportRepair.exporting'),completed:$t('ReportRepair.exported'),failed:$t('ReportRepair.exportFailed')}
const {fields,terms,search,canDownload,rows,total,current,loading,error,downloading,load,pageChange,download}=useExports()
</script>