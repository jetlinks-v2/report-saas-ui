<template>
 <a-card title="导出管理"><template #extra><a-button :loading="loading" @click="load">刷新</a-button></template>
  <ConditionFilter v-model="terms" :fields="fields" @change="search" />
  <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
  <a-table :data-source="rows" :loading="loading" row-key="id" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
   <a-table-column key="name" title="文件名" data-index="name" />
   <a-table-column key="creator" title="导出人" data-index="creatorName" />
   <a-table-column key="time" title="创建时间"><template #default="{record}">{{formatTime(record.createTime)}}</template></a-table-column>
   <a-table-column key="status" title="状态"><template #default="{record}"><a-tag :color="record.status==='completed'?'green':record.status==='failed'?'red':'blue'">{{ statusNames[record.status] }}</a-tag></template></a-table-column>
   <a-table-column key="action" title="操作"><template #default="{record}"><a-button v-if="canDownload" type="link" :loading="downloading===record.id" :disabled="record.status!=='completed'" @click="download(record)">下载</a-button></template></a-table-column>
  </a-table>
 </a-card>
</template>
<script setup lang="ts">
import { useExports } from '../../../hooks/useExports'
import { formatTime } from '../../../utils'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
const statusNames:Record<string,string>={processing:'导出中',completed:'导出成功',failed:'导出失败'}
const {fields,terms,search,canDownload,rows,total,current,loading,error,downloading,load,pageChange,download}=useExports()
</script>
