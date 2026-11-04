<template>
  <a-drawer :open="!!state.parent" :title="state.parent?.name+' · 报事描述'" :width="760" @close="emit('close')">
    <a-space style="margin-bottom:16px"><a-button v-if="canSave" type="primary" @click="emit('edit')">新增</a-button><a-button @click="emit('refresh')">刷新</a-button></a-space>
    <a-alert v-if="state.error" :message="state.error" type="error" show-icon style="margin-bottom:12px" />
    <a-table table-layout="fixed" :data-source="state.rows" :loading="state.loading" row-key="id" :pagination="{current:state.current,pageSize:state.pageSize,total:state.total,showSizeChanger:true,pageSizeOptions:['10','20','30','50']}" @change="emit('page',$event)">
      <a-table-column key="content" title="报事描述"><template #default="{record}"><span style="white-space:pre-wrap;overflow-wrap:anywhere">{{record.configuration.content||record.name}}</span></template></a-table-column>
      <a-table-column key="sort" title="排序" data-index="sortIndex" :width="64" align="center" />
      <a-table-column key="status" title="状态" :width="64" align="center"><template #default="{record}">{{record.enabled?'启用':'停用'}}</template></a-table-column>
      <a-table-column key="time" title="更新时间" :width="150" align="center"><template #default="{record}">{{formatTime(record.modifyTime)}}</template></a-table-column>
      <a-table-column v-if="canSave" key="actions" title="操作" :width="140" align="center"><template #default="{record}"><a-button type="link" :disabled="state.saving" @click="emit('toggle',record)">{{record.enabled?'停用':'启用'}}</a-button><a-button type="link" @click="emit('edit',record)">编辑</a-button><a-popconfirm v-if="!record.enabled" title="删除此报事描述？" @confirm="emit('remove',record)"><a-button type="link" danger :disabled="state.saving">删除</a-button></a-popconfirm></template></a-table-column>
    </a-table>
  </a-drawer>
  <a-modal :open="state.editing" :title="state.form.id?'编辑报事描述':'新增报事描述'" :confirm-loading="state.saving" @cancel="emit('cancelEdit')" @ok="emit('save')">
    <a-alert v-if="state.error" :message="state.error" type="error" show-icon style="margin-bottom:12px" />
    <a-form :ref="(instance:unknown)=>emit('formRef',instance)" :model="state.form" layout="vertical">
      <a-form-item label="报事描述" :name="['configuration','content']" :rules="[{required:true,whitespace:true,message:'请填写报事描述'}]"><a-textarea v-model:value="state.form.configuration.content" :maxlength="800" :rows="4" show-count /></a-form-item>
      <a-form-item label="排序" name="sortIndex" :rules="[{required:true,type:'integer',min:0,message:'请输入非负排序'}]"><a-input-number v-model:value="state.form.sortIndex" :min="0" :precision="0" /></a-form-item>
      <a-form-item label="状态"><a-switch v-model:checked="state.form.enabled" /></a-form-item>
    </a-form>
  </a-modal>
</template>
<script setup lang="ts">
import type { Configuration } from '../types'
import type { useDescriptionConfiguration } from '../hooks/useDescriptionConfiguration'
import { formatTime } from '../utils'
defineProps<{state:ReturnType<typeof useDescriptionConfiguration>;canSave:boolean}>()
const emit=defineEmits<{
  close:[];refresh:[];edit:[row?:Configuration];toggle:[row:Configuration];remove:[row:Configuration];save:[];cancelEdit:[]
  page:[page:{current?:number;pageSize?:number}];formRef:[instance:unknown]
}>()
</script>
