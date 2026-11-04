<template>
 <a-card :title="page.title">
  <template #extra><a-space><a-button :loading="loading" @click="load">刷新</a-button><a-button v-if="canExport" :loading="exporting" @click="startExport">导出数据</a-button></a-space></template>
  <ConditionFilter v-model="terms" :fields="fields" @change="search" />
  <a-alert v-if="error" :message="error" type="error" show-icon style="margin:16px 0" />
  <a-table v-if="page.mode!=='evaluation'" :columns="columns" :data-source="rows" :loading="loading" row-key="projectId" :scroll="{x:'max-content'}" :pagination="{pageSize:20,showSizeChanger:false}">
   <template #bodyCell="{column,record,text}"><a-button v-if="canDrill(column.key)" type="link" @click="drill(record,column.key)">{{text}}</a-button><template v-else>{{String(column.key).endsWith('Rate')?`${text}%`:text}}</template></template>
  </a-table>

  <a-table v-else :data-source="orders" :loading="loading" row-key="id" :scroll="{x:1800}" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
   <a-table-column key="number" title="报事编号" data-index="number" />
   <a-table-column key="project" title="项目名称" data-index="businessProjectName" />
   <a-table-column key="description" title="报事内容" data-index="description" :ellipsis="true" />
   <a-table-column key="assignee" title="责任人" data-index="assignedUserName" />
   <a-table-column key="staff" title="员工满意度"><template #default="{record}">{{record.staffEvaluated?(record.staffSatisfactionName||'满意度')+'（'+record.staffSatisfaction+'分）':'未评价'}}</template></a-table-column>
   <a-table-column key="owner" title="业主满意度"><template #default="{record}">{{record.ownerEvaluated?(record.ownerSatisfactionName||'满意度')+'（'+record.ownerSatisfaction+'分）':'未登记'}}</template></a-table-column>
   <a-table-column key="ownerName" title="业主姓名" data-index="evaluationOwnerName" />
   <a-table-column key="ownerPhone" title="业主联系方式" data-index="evaluationOwnerPhone" />
   <a-table-column key="recorder" title="评价登记人" data-index="ownerEvaluationRecorderName" />
   <a-table-column key="time" title="评价时间"><template #default="{record}">{{formatTime(record.ownerEvaluationTime)}}</template></a-table-column>
  </a-table>
  <a-modal v-model:open="exportOpen" title="导出管理" :confirm-loading="exporting" :closable="!exporting" :mask-closable="!exporting" :cancel-button-props="{disabled:exporting}" @ok="exportData">
   <a-form layout="vertical"><a-form-item label="导出选择"><a-radio-group v-model:value="exportScope"><a-radio value="all">全部导出</a-radio><a-radio value="current">按当前条件导出</a-radio></a-radio-group></a-form-item></a-form>
   <p>全部导出：导出当前应用内有权访问的全部{{page.title}}。</p><p>按当前条件导出：按当前搜索条件导出。</p><p>一次最多处理200000条源工单，请通过条件查询分批导出。生成后在“报事处理 &gt; 导出管理”下载。</p>
   <a-alert v-if="error" :message="error" type="error" show-icon />
  </a-modal>
 </a-card>
</template>
<script setup lang="ts">
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import { useReports } from '../../../hooks/useReports'
import { formatTime } from '../../../utils'
const {terms,page,columns,fields,rows,orders,total,current,loading,exporting,error,canExport,canDrill,drill,load,search,pageChange,exportData,exportOpen,exportScope,startExport}=useReports()
</script>
