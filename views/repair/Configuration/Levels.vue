<template>
  <div class="report-level-page">
    <a-alert v-if="error" class="level-error" :message="error" type="error" show-icon />
    <a-card class="level-list" title="报事等级列表" :bordered="false">
      <template #extra><a-button v-if="canSave" type="primary" size="small" :disabled="saving" @click="select()">新增</a-button></template>
      <a-select v-model:value="businessProjectId" aria-label="业务项目" :options="projectOptions" :disabled="saving" placeholder="请选择业务项目" class="project-select" />
      <a-input-search v-model:value="keyword" placeholder="搜索等级名称" allow-clear />
      <a-list :data-source="visibleRows" :loading="loading" row-key="id" class="level-list-body">
        <template #renderItem="{ item }">
          <a-list-item :class="{ active: form.id === item.id }">
            <button type="button" class="level-item" :disabled="saving" @click="select(item)">
              <span class="color-dot" :style="{ backgroundColor: item.configuration.color || '#999' }" />
              <span class="level-name"><span>{{ item.name }}</span><small>系数 {{ item.configuration.coefficient }}</small></span>
              <a-tag :color="item.enabled ? 'green' : 'default'">{{ item.enabled ? '启用' : '禁用' }}</a-tag>
            </button>
          </a-list-item>
        </template>
      </a-list>
      <a-button block :disabled="saving" @click="load()">刷新</a-button>
    </a-card>
    <div class="level-detail">
      <a-card title="等级基础属性" :bordered="false">
        <a-form ref="formRef" :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }" :disabled="!canSave || saving">
          <a-form-item label="业务项目" name="businessProjectId" :rules="[{required:true,message:'请选择业务项目'}]">
            <span>{{ projectOptions.find(item => item.value === form.businessProjectId)?.label || '请选择业务项目' }}</span>
          </a-form-item>
          <a-form-item label="等级名称" name="name" :rules="[{required:true,whitespace:true,message:'请输入等级名称'},{max:64,message:'等级名称不能超过64字'}]">
            <a-input v-model:value="form.name" placeholder="请输入等级名称" :maxlength="64" />
          </a-form-item>
          <a-form-item label="颜色标识" :name="['configuration','color']" :rules="[{required:true,whitespace:true,message:'请选择颜色标识'}]">
            <div class="color-row"><input v-model="form.configuration.color" type="color" aria-label="选择颜色" class="color-input" :disabled="!canSave || saving" /><a-input v-model:value="form.configuration.color" placeholder="#E5484D" /></div>
          </a-form-item>
          <a-form-item label="是否启用"><a-switch v-model:checked="form.enabled" checked-children="启用" un-checked-children="禁用" /></a-form-item>
          <a-form-item label="审核角色"><a-switch :checked="form.configuration.auditRequired" checked-children="需要" un-checked-children="不需要" @change="changeAudit" /></a-form-item>
          <a-form-item v-if="form.configuration.auditRequired" label="选择角色" :name="['configuration','auditRoleId']" :rules="[{required:true,message:'请选择审核角色'}]">
            <a-select v-model:value="form.configuration.auditRoleId" :options="roleOptions" show-search allow-clear option-filter-prop="label" placeholder="请选择审核角色" />
          </a-form-item>
          <a-form-item label="关联第三方"><a-switch v-model:checked="form.configuration.thirdParty" checked-children="是" un-checked-children="否" /></a-form-item>
          <a-form-item label="等级系数" :name="['configuration','coefficient']" :rules="[{required:true,type:'integer',min:1,max:999,message:'请输入1-999的等级系数'}]">
            <a-input-number v-model:value="form.configuration.coefficient" :min="1" :max="999" :precision="0" style="width:100%" placeholder="1-999" />
            <div class="coefficient-tip">系数值为 1-999，数值越高，代表事件等级越高</div>
          </a-form-item>
          <a-form-item v-if="canSave" label="操作">
            <a-space>
              <a-button type="primary" :loading="saving" @click="save">保存</a-button>
              <a-button @click="select()">清空</a-button>
              <a-popconfirm v-if="form.id" title="确认删除该等级吗？已被工单引用的等级不能删除。" @confirm="remove"><a-button danger>删除</a-button></a-popconfirm>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>
      <a-card title="流程预览" :bordered="false" class="preview-card">
        <div class="flow-preview">
          <div v-for="(node,index) in previewNodes" :key="node.key" class="flow-node-wrap">
            <div class="flow-node" :class="node.type">{{ node.title }}</div>
            <span v-if="index < previewNodes.length-1" class="flow-arrow" aria-hidden="true">→</span>
          </div>
        </div>
        <div v-if="form.configuration.auditRequired" class="reject-line">↶ 审核不通过后退回处理中</div>
      </a-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLevelConfiguration } from '../../../hooks/useLevelConfiguration'
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
