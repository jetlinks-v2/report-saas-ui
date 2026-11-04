<template>
 <a-card :title="page.title">
  <template #extra><a-space><a-button :loading="loading" @click="load">{{$t('ReportRepair.refresh')}}</a-button><a-button v-if="canExport" :loading="exporting" @click="startExport">{{$t('ReportRepair.exportData')}}</a-button></a-space></template>
  <ConditionFilter v-model="terms" :fields="fields" @change="search" />
  <a-alert v-if="error" :message="error" type="error" show-icon style="margin:16px 0" />
  <a-table v-if="page.mode!=='evaluation'" :columns="columns" :data-source="rows" :loading="loading" row-key="projectId" :scroll="{x:'max-content'}" :pagination="{pageSize:20,showSizeChanger:false}">
   <template #bodyCell="{column,record,text}"><a-button v-if="canDrill(column.key)" type="link" @click="drill(record,column.key)">{{text}}</a-button><template v-else>{{String(column.key).endsWith('Rate')?`${text}%`:text}}</template></template>
  </a-table>

  <a-table v-else :data-source="orders" :loading="loading" row-key="id" :scroll="{x:1800}" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
   <a-table-column key="number" :title="$t('ReportRepair.issueNumber')" data-index="number" />
   <a-table-column key="project" :title="$t('ReportRepair.projectName')" data-index="businessProjectName" />
   <a-table-column key="description" :title="$t('ReportRepair.issueContent')" data-index="description" :ellipsis="true" />
   <a-table-column key="assignee" :title="$t('ReportRepair.assignee')" data-index="assignedUserName" />
   <a-table-column key="staff" :title="$t('ReportRepair.employeeSatisfaction')"><template #default="{record}">{{record.staffEvaluated?$t('ReportRepair.ratingWithScore', {name:record.staffSatisfactionName||$t('ReportRepair.satisfaction'),score:record.staffSatisfaction}):$t('ReportRepair.notRated')}}</template></a-table-column>
   <a-table-column key="owner" :title="$t('ReportRepair.ownerSatisfaction')"><template #default="{record}">{{record.ownerEvaluated?$t('ReportRepair.ratingWithScore', {name:record.ownerSatisfactionName||$t('ReportRepair.satisfaction'),score:record.ownerSatisfaction}):$t('ReportRepair.notRecorded')}}</template></a-table-column>
   <a-table-column key="ownerName" :title="$t('ReportRepair.ownerName')" data-index="evaluationOwnerName" />
   <a-table-column key="ownerPhone" :title="$t('ReportRepair.ownerContactInformation')" data-index="evaluationOwnerPhone" />
   <a-table-column key="recorder" :title="$t('ReportRepair.ratingRecordedBy')" data-index="ownerEvaluationRecorderName" />
   <a-table-column key="time" :title="$t('ReportRepair.rated')"><template #default="{record}">{{formatTime(record.ownerEvaluationTime)}}</template></a-table-column>
  </a-table>
  <a-modal v-model:open="exportOpen" :title="$t('ReportRepair.exports')" :confirm-loading="exporting" :closable="!exporting" :mask-closable="!exporting" :cancel-button-props="{disabled:exporting}" @ok="exportData">
   <a-form layout="vertical"><a-form-item :label="$t('ReportRepair.exportScope')"><a-radio-group v-model:value="exportScope"><a-radio value="all">{{$t('ReportRepair.exportAll')}}</a-radio><a-radio value="current">{{$t('ReportRepair.exportFilteredResults')}}</a-radio></a-radio-group></a-form-item></a-form>
   <p>{{$t('ReportRepair.exportAllHint', {type:page.title})}}</p><p>{{$t('ReportRepair.exportFilteredResultsApplyTheCurrentSearchFilters')}}</p><p>{{$t('ReportRepair.processUpTo200000SourceOrdersPerBatch')}}</p>
   <a-alert v-if="error" :message="error" type="error" show-icon />
  </a-modal>
 </a-card>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import { useReports } from '../../../hooks/useReports'
import { formatTime } from '../../../utils'
const { t: $t } = useI18n()
const {terms,page,columns,fields,rows,orders,total,current,loading,exporting,error,canExport,canDrill,drill,load,search,pageChange,exportData,exportOpen,exportScope,startExport}=useReports()
</script>
