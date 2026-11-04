<template>
  <a-card title="共享基础数据">
    <template #extra><a-space><a-button :loading="loading" @click="load">刷新</a-button><a-button v-if="canSync" type="primary" :loading="saving" @click="sync">同步 Cloud 资料</a-button></a-space></template>
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
    <a-tabs v-model:active-key="kind" @change="changeKind"><a-tab-pane key="organizations" tab="组织与业务项目" /><a-tab-pane key="persons" tab="人员身份" /><a-tab-pane key="spaces" tab="空间归属" /></a-tabs>
    <a-table :data-source="rows" :loading="loading" row-key="id" :pagination="{ current, total, pageSize:20, showSizeChanger:false }" @change="pageChange">
      <a-table-column key="sourceName" title="Cloud 名称" data-index="sourceName" />
      <a-table-column key="displayName" title="业务名称"><template #default="{record}"><a-input :value="record.displayName" placeholder="沿用 Cloud 名称" :disabled="saving || !canSave" @press-enter="save(record,{displayName:$event.target.value})" @blur="record.displayName !== $event.target.value && save(record,{displayName:$event.target.value})" /></template></a-table-column>
      <a-table-column v-if="kind==='organizations'" key="project" title="业务项目"><template #default="{record}"><a-switch :checked="!!record.businessProject" :disabled="saving || !canSave" @change="save(record,{businessProject:$event})" /></template></a-table-column>
      <template v-if="kind==='persons'">
        <a-table-column key="employee" title="员工"><template #default="{record}"><a-switch :checked="!!record.employee" :disabled="saving || !canSave" @change="save(record,{employee:$event})" /></template></a-table-column>
        <a-table-column key="owner" title="业主"><template #default="{record}"><a-switch :checked="!!record.owner" :disabled="saving || !canSave" @change="save(record,{owner:$event})" /></template></a-table-column>
      </template>
      <a-table-column v-if="kind==='spaces'" key="businessProject" title="所属业务项目"><template #default="{record}"><a-select :value="record.businessProjectId" :options="options" placeholder="选择业务项目" style="min-width:220px" :disabled="saving || !canSave" @change="save(record,{businessProjectId:$event})" /></template></a-table-column>
    </a-table>
  </a-card>
</template>
<script setup lang="ts">
import { useSharedData } from '../../../hooks/useSharedData'
const { canSave, canSync, kind, rows, options, loading, saving, error, total, current, load, changeKind, pageChange, sync, save } = useSharedData()
</script>
