<template>
  <div class="report-level-page">
    <a-alert v-if="error" class="level-error" :message="error" type="error" show-icon />
    <a-card class="level-list" :title="$t('ReportRepair.issuePriorities')" :bordered="false">
      <template #extra><a-button v-if="canSave" type="primary" size="small" :disabled="saving" @click="select()">{{$t('ReportRepair.add')}}</a-button></template>
      <a-select v-model:value="businessProjectId" :aria-label="$t('ReportRepair.project')" :options="projectOptions" :disabled="saving" :placeholder="$t('ReportRepair.selectAProject')" class="project-select" />
      <a-input-search v-model:value="keyword" :placeholder="$t('ReportRepair.searchPriorities')" allow-clear />
      <a-list :data-source="visibleRows" :loading="loading" row-key="id" class="level-list-body">
        <template #renderItem="{ item }">
          <a-list-item :class="{ active: form.id === item.id }">
            <button type="button" class="level-item" :disabled="saving" @click="select(item)">
              <span class="color-dot" :style="{ backgroundColor: item.configuration.color || '#999' }" />
              <span class="level-name"><span>{{ item.name }}</span><small>{{$t('ReportRepair.coefficient')}}{{ item.configuration.coefficient }}</small></span>
              <a-tag :color="item.enabled ? 'green' : 'default'">{{ item.enabled ? $t('ReportRepair.enable') : $t('ReportRepair.disabled') }}</a-tag>
            </button>
          </a-list-item>
        </template>
      </a-list>
      <a-button block :disabled="saving" @click="load()">{{$t('ReportRepair.refresh')}}</a-button>
    </a-card>
    <div class="level-detail">
      <a-card :title="$t('ReportRepair.priorityProperties')" :bordered="false">
        <a-form ref="formRef" :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }" :disabled="!canSave || saving">
          <a-form-item :label="$t('ReportRepair.project')" name="businessProjectId" :rules="[{required:true,message:$t('ReportRepair.selectAProject')}]">
            <span>{{ projectOptions.find(item => item.value === form.businessProjectId)?.label || $t('ReportRepair.selectAProject') }}</span>
          </a-form-item>
          <a-form-item :label="$t('ReportRepair.priorityName')" name="name" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.enterAPriorityName')},{max:64,message:$t('ReportRepair.priorityNamesMustNotExceed64Characters')}]">
            <a-input v-model:value="form.name" :placeholder="$t('ReportRepair.enterAPriorityName')" :maxlength="64" />
          </a-form-item>
          <a-form-item :label="$t('ReportRepair.color')" :name="['configuration','color']" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.selectAColor')}]">
            <div class="color-row"><input v-model="form.configuration.color" type="color" :aria-label="$t('ReportRepair.chooseColor')" class="color-input" :disabled="!canSave || saving" /><a-input v-model:value="form.configuration.color" placeholder="#E5484D" /></div>
          </a-form-item>
          <a-form-item :label="$t('ReportRepair.enabled')"><a-switch v-model:checked="form.enabled" :checked-children="$t('ReportRepair.enable')" :un-checked-children="$t('ReportRepair.disabled')" /></a-form-item>
          <a-form-item :label="$t('ReportRepair.reviewerRole')"><a-switch :checked="form.configuration.auditRequired" :checked-children="$t('ReportRepair.required')" :un-checked-children="$t('ReportRepair.notRequired')" @change="changeAudit" /></a-form-item>
          <a-form-item v-if="form.configuration.auditRequired" :label="$t('ReportRepair.selectRole')" :name="['configuration','auditRoleId']" :rules="[{required:true,message:$t('ReportRepair.selectAReviewerRole')}]">
            <a-select v-model:value="form.configuration.auditRoleId" :options="roleOptions" show-search allow-clear option-filter-prop="label" :placeholder="$t('ReportRepair.selectAReviewerRole')" />
          </a-form-item>
          <a-form-item :label="$t('ReportRepair.linkThirdPartySystem')"><a-switch v-model:checked="form.configuration.thirdParty" :checked-children="$t('ReportRepair.yes')" :un-checked-children="$t('ReportRepair.no')" /></a-form-item>
          <a-form-item :label="$t('ReportRepair.priorityCoefficient')" :name="['configuration','coefficient']" :rules="[{required:true,type:'integer',min:1,max:999,message:$t('ReportRepair.enterACoefficientFrom1To999')}]">
            <a-input-number v-model:value="form.configuration.coefficient" :min="1" :max="999" :precision="0" style="width:100%" placeholder="1-999" />
            <div class="coefficient-tip">{{$t('ReportRepair.enter1999AHigherCoefficientIndicatesAHigher')}}</div>
          </a-form-item>
          <a-form-item v-if="canSave" :label="$t('ReportRepair.actions')">
            <a-space>
              <a-button type="primary" :loading="saving" @click="save">{{$t('ReportRepair.save')}}</a-button>
              <a-button @click="select()">{{$t('ReportRepair.clear')}}</a-button>
              <a-popconfirm v-if="form.id" :title="$t('ReportRepair.deleteThisPriorityPrioritiesReferencedByOrdersCannotBe')" @confirm="remove"><a-button danger>{{$t('ReportRepair.delete')}}</a-button></a-popconfirm>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>
      <a-card :title="$t('ReportRepair.workflowPreview')" :bordered="false" class="preview-card">
        <div class="flow-preview">
          <div v-for="(node,index) in previewNodes" :key="node.key" class="flow-node-wrap">
            <div class="flow-node" :class="node.type">{{ node.title }}</div>
            <span v-if="index < previewNodes.length-1" class="flow-arrow" aria-hidden="true">→</span>
          </div>
        </div>
        <div v-if="form.configuration.auditRequired" class="reject-line">{{$t('ReportRepair.returnToInProgressIfTheReviewIsRejected')}}</div>
      </a-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLevelConfiguration } from '../../../hooks/useLevelConfiguration'
const { t: $t } = useI18n()
const { canSave,projectOptions,roleOptions,businessProjectId,keyword,visibleRows,loading,saving,error,formRef,form,previewNodes,select,load,changeAudit,save,remove } = useLevelConfiguration()
</script>
<style scoped>
.report-level-page { display:grid; grid-template-columns:320px minmax(0,1fr); gap:16px; min-height:640px }
.level-error { grid-column:1/-1 }
.project-select { width:100%; margin-bottom:12px }
.level-list-body { margin-top:16px; max-height:650px; overflow:auto }
.level-list-body :deep(.ant-list-item) { padding:0; border-radius:6px }
.level-list-body :deep(.ant-list-item.active) { background:var(--ant-color-primary-bg,#e6f4ff) }
.level-item { display:flex; align-items:center; gap:12px; width:100%; border:0; background:none; padding:14px 8px; cursor:pointer; text-align:left; color:inherit }
.color-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0 }
.level-name { flex:1; min-width:0; overflow-wrap:anywhere; display:flex; flex-direction:column }
.level-name small,.coefficient-tip { color:var(--ant-color-text-secondary,#8c8c8c); font-size:12px }
.color-row { display:flex; align-items:center; gap:12px }
.color-input { width:40px; height:32px; padding:0; border:0; background:none }
.level-detail :deep(.ant-switch) { min-width:64px }
.preview-card { margin-top:16px }
.flow-preview { display:flex; flex-wrap:wrap; align-items:center; gap:12px; padding:16px 0 }
.flow-node-wrap { display:flex; align-items:center; gap:12px }
.flow-node { border:1px solid var(--ant-color-border,#d9d9d9); border-radius:6px; padding:12px 18px; background:var(--ant-color-bg-layout,#fafafa) }
.flow-node.audit { border-color:#faad14; background:#fffbe6 }
.flow-node.third { border-color:#1677ff; background:#e6f4ff }
.flow-node.done { border-color:#52c41a; background:#f6ffed }
.flow-arrow { color:#8c8c8c }
.reject-line { color:#cf1322; margin-top:12px }
@media (max-width:1000px) { .report-level-page { grid-template-columns:1fr } .level-list-body { max-height:260px } }
</style>
