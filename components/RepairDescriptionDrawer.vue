<template>
  <a-drawer :open="!!state.parent" :title="state.parent?.name+$t('ReportRepair.issueDescriptions')" :width="760" @close="emit('close')">
    <a-space style="margin-bottom:16px"><a-button v-if="canSave" type="primary" @click="emit('edit')">{{$t('ReportRepair.add')}}</a-button><a-button @click="emit('refresh')">{{$t('ReportRepair.refresh')}}</a-button></a-space>
    <a-alert v-if="state.error" :message="state.error" type="error" show-icon style="margin-bottom:12px" />
    <a-table table-layout="fixed" :data-source="state.rows" :loading="state.loading" row-key="id" :pagination="{current:state.current,pageSize:state.pageSize,total:state.total,showSizeChanger:true,pageSizeOptions:['10','20','30','50']}" @change="emit('page',$event)">
      <a-table-column key="content" :title="$t('ReportRepair.issueDescription')"><template #default="{record}"><span style="white-space:pre-wrap;overflow-wrap:anywhere">{{record.configuration.content||record.name}}</span></template></a-table-column>
      <a-table-column key="sort" :title="$t('ReportRepair.sortOrder')" data-index="sortIndex" :width="64" align="center" />
      <a-table-column key="status" :title="$t('ReportRepair.status')" :width="64" align="center"><template #default="{record}">{{record.enabled?$t('ReportRepair.enable'):$t('ReportRepair.disable')}}</template></a-table-column>
      <a-table-column key="time" :title="$t('ReportRepair.updated')" :width="150" align="center"><template #default="{record}">{{formatTime(record.modifyTime)}}</template></a-table-column>
      <a-table-column v-if="canSave" key="actions" :title="$t('ReportRepair.actions')" :width="140" align="center"><template #default="{record}"><a-button type="link" :disabled="state.saving" @click="emit('toggle',record)">{{record.enabled?$t('ReportRepair.disable'):$t('ReportRepair.enable')}}</a-button><a-button type="link" @click="emit('edit',record)">{{$t('ReportRepair.edit')}}</a-button><a-popconfirm v-if="!record.enabled" :title="$t('ReportRepair.deleteThisIssueDescription')" @confirm="emit('remove',record)"><a-button type="link" danger :disabled="state.saving">{{$t('ReportRepair.delete')}}</a-button></a-popconfirm></template></a-table-column>
    </a-table>
  </a-drawer>
  <a-modal :open="state.editing" :title="state.form.id?$t('ReportRepair.editIssueDescription'):$t('ReportRepair.addIssueDescription')" :confirm-loading="state.saving" @cancel="emit('cancelEdit')" @ok="emit('save')">
    <a-alert v-if="state.error" :message="state.error" type="error" show-icon style="margin-bottom:12px" />
    <a-form :ref="(instance:unknown)=>emit('formRef',instance)" :model="state.form" layout="vertical">
      <a-form-item :label="$t('ReportRepair.issueDescription')" :name="['configuration','content']" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.descriptionRequired')}]"><a-textarea v-model:value="state.form.configuration.content" :maxlength="800" :rows="4" show-count /></a-form-item>
      <a-form-item :label="$t('ReportRepair.sortOrder')" name="sortIndex" :rules="[{required:true,type:'integer',min:0,message:$t('ReportRepair.enterANonNegativeSortOrder')}]"><a-input-number v-model:value="state.form.sortIndex" :min="0" :precision="0" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.status')"><a-switch v-model:checked="state.form.enabled" /></a-form-item>
    </a-form>
  </a-modal>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Configuration } from '../types'
import type { useDescriptionConfiguration } from '../hooks/useDescriptionConfiguration'
import { formatTime } from '../utils'
const { t: $t } = useI18n()
defineProps<{state:ReturnType<typeof useDescriptionConfiguration>;canSave:boolean}>()
const emit=defineEmits<{
  close:[];refresh:[];edit:[row?:Configuration];toggle:[row:Configuration];remove:[row:Configuration];save:[];cancelEdit:[]
  page:[page:{current?:number;pageSize?:number}];formRef:[instance:unknown]
}>()
</script>
