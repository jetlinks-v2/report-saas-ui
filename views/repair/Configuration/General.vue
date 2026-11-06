<template>
  <a-card :title="title">
    <template #extra><a-space v-if="!isFlow||activeTab==='configuration'"><a-button v-if="canSave&&kind==='category'&&!isFlow" @click="formSettings.edit(businessProjectId)">{{$t('ReportRepair.formDisplaySettings')}}</a-button><a-button v-if="canSave" type="primary" @click="edit()">{{$t('ReportRepair.add')}}</a-button></a-space></template>
    <a-tabs v-if="isFlow" v-model:active-key="activeTab"><a-tab-pane key="configuration" :tab="$t('ReportRepair.workflowConfiguration')" /><a-tab-pane key="diagram" :tab="$t('ReportRepair.workflowDiagram')" /></a-tabs>
    <RepairWorkflowDiagram v-if="isFlow&&activeTab==='diagram'" />
    <template v-if="!isFlow||activeTab==='configuration'">
    <div class="configuration-layout">
    <RepairCategoryTree v-if="kind==='category'&&!isFlow" :state="categoryTreeState" @add="addCategory" @edit="edit" @remove="remove" @select="selectCategory" />
    <div class="configuration-list">
    <ConditionFilter v-if="filterFields.length" v-model="filterTerms" :fields="filterFields" @change="search" />
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
    <a-select v-model:value="businessProjectId" :options="projectOptions" :placeholder="$t('ReportRepair.allProjects')" allow-clear style="width:260px;margin-bottom:16px" />
    <a-table :scroll="{x:'max-content'}" :data-source="rows" :loading="loading" row-key="id" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
      <a-table-column key="project" :title="$t('ReportRepair.project')"><template #default="{record}">{{projectName(record.businessProjectId)}}</template></a-table-column>
      <a-table-column v-if="!isFlow&&['category','label','description'].includes(actualKind)" key="parent" :title="$t('ReportRepair.parentCategoryTag')"><template #default="{record}">{{parentName(record.parentId)}}</template></a-table-column>
      <a-table-column v-if="actualKind==='qr'" key="code" :title="$t('ReportRepair.configurationCode')"><template #default="{record}">{{record.configuration.code}}</template></a-table-column>
      <a-table-column v-if="actualKind!=='commission'" key="name" :title="isFlow?$t('ReportRepair.issueCategory'):nameLabel"><template #default="{record}"><div style="max-width:420px;white-space:pre-wrap">{{record.configuration.content||record.name}}</div></template></a-table-column>
      <template v-if="actualKind==='commission'">
        <template v-for="group in commissionGroups" :key="group.key">
          <a-table-column v-for="recipient in commissionRecipients" :key="group.key+recipient.key" :title="group.label+'-'+recipient.label+$t('ReportRepair.commissionRate')"><template #default="{record}">{{record.configuration[group.key]?.[recipient.key]??'—'}}%</template></a-table-column>
        </template>
      </template>
      <a-table-column v-if="actualKind==='satisfaction'" key="score" :title="$t('ReportRepair.score')"><template #default="{record}">{{record.configuration.score}}</template></a-table-column>
      <a-table-column v-if="actualKind==='evaluationLabel'" key="satisfaction" :title="$t('ReportRepair.rating')"><template #default="{record}">{{parentName(record.configuration.satisfactionId)}}</template></a-table-column>
      <a-table-column v-if="actualKind==='reply'" key="node" :title="$t('ReportRepair.processingStep')"><template #default="{record}">{{({1:$t('ReportRepair.normalCompletion'),5:$t('ReportRepair.followUp'),7:$t('ReportRepair.abnormalCompletion')} as Record<number,string>)[record.configuration.staticNode]||$t('ReportRepair.notConfigured')}}</template></a-table-column>
      <a-table-column v-if="!isFlow&&['category','label','description'].includes(actualKind)" key="sort" :title="$t('ReportRepair.sortOrder')" data-index="sortIndex" />
      <a-table-column v-if="actualKind==='level'" key="level" :title="$t('ReportRepair.priorityRules')"><template #default="{record}"><a-tag :color="record.configuration.color">{{$t('ReportRepair.coefficient')}}{{record.configuration.coefficient}}</a-tag>{{record.configuration.auditRequired?$t('ReportRepair.reviewRequired'):$t('ReportRepair.noReviewRequired')}}</template></a-table-column>
      <a-table-column v-if="isFlow" key="finishDays" :title="$t('ReportRepair.completionDeadlineDays')"><template #default="{record}">{{record.configuration.finishTimeLimitDays}}</template></a-table-column>
      <a-table-column v-if="isFlow" key="transfer" :title="$t('ReportRepair.transferLimit')"><template #default="{record}">{{record.configuration.transferLimit}}</template></a-table-column>
      <a-table-column v-if="isFlow" key="delay" :title="$t('ReportRepair.extensionLimit')"><template #default="{record}">{{record.configuration.delayLimit}}</template></a-table-column>
      <template v-if="isFlow">
        <a-table-column key="flowCreator" :title="$t('ReportRepair.operator')"><template #default="{record}">{{record.flowCreatorName||record.creatorName||'—'}}</template></a-table-column>
        <a-table-column key="autoDispatch" :title="$t('ReportRepair.automaticAssignment')"><template #default="{record}">{{record.configuration.autoDispatchEnable?$t('ReportRepair.on'):$t('ReportRepair.close')}}</template></a-table-column>
        <a-table-column key="dispatchMinutes" :title="$t('ReportRepair.durationMinutes')"><template #default="{record}">{{record.configuration.autoDispatchEnable?record.configuration.autoDispatchMinutes:'—'}}</template></a-table-column>
        <a-table-column key="dispatchRole" :title="$t('ReportRepair.assignmentRole')"><template #default="{record}">{{record.configuration.autoDispatchEnable?roleName(record,'autoDispatchRoleId'):'—'}}</template></a-table-column>
        <a-table-column key="followRole" :title="$t('ReportRepair.handlingRole')"><template #default="{record}">{{roleName(record,'followRoleId')}}</template></a-table-column>
        <a-table-column key="callbackRequired" :title="$t('ReportRepair.followUpVisitRequired')"><template #default="{record}">{{record.configuration.callbackRequired?$t('ReportRepair.yes'):$t('ReportRepair.no')}}</template></a-table-column>
        <a-table-column key="callbackRole" :title="$t('ReportRepair.followUpVisitRole')"><template #default="{record}">{{record.configuration.callbackRequired?roleName(record,'callbackRoleId'):'—'}}</template></a-table-column>
        <a-table-column key="levelRole" :title="$t('ReportRepair.priorityChangeReviewerRole')"><template #default="{record}">{{roleName(record,'levelChangeRoleId')}}</template></a-table-column>
        <a-table-column key="flowTime" :title="$t('ReportRepair.updated')"><template #default="{record}">{{formatTime(record.flowModifyTime??record.modifyTime)}}</template></a-table-column>
      </template>
      <a-table-column v-if="!isFlow" key="creator" :title="$t('ReportRepair.operator')" data-index="creatorName" />
      <a-table-column v-if="!isFlow" key="modified" :title="$t('ReportRepair.updated')"><template #default="{record}">{{formatTime(record.modifyTime)}}</template></a-table-column>
      <a-table-column v-if="actualKind!=='reply'" key="enabled" :title="isFlow?$t('ReportRepair.workflowStatus'):$t('ReportRepair.status')"><template #default="{record}"><a-tag :color="(isFlow?flowEnabled(record):record.enabled)?'green':'default'">{{(isFlow?flowEnabled(record):record.enabled)?$t('ReportRepair.enable'):$t('ReportRepair.disable')}}</a-tag></template></a-table-column>
      <a-table-column key="action" :title="$t('ReportRepair.actions')"><template #default="{record}"><template v-if="actualKind==='qr'"><a-button type="link" @click="qrPreview=record">{{$t('ReportRepair.qrCode')}}</a-button><a-button type="link" @click="qr.copyLink(record)">{{$t('ReportRepair.copyLink')}}</a-button></template><a-button v-if="canSave" type="link" @click="edit(record)">{{$t('ReportRepair.edit')}}</a-button><a-button v-if="canSave&&actualKind!=='reply'" type="link" :disabled="saving" @click="toggle(record)">{{(isFlow?flowEnabled(record):record.enabled)?$t('ReportRepair.disable'):$t('ReportRepair.enable')}}</a-button><a-popconfirm v-if="canSave&&(['category','commission','reply'].includes(actualKind)&&!isFlow||(isFlow?!flowEnabled(record):!record.enabled))" :title="isFlow?$t('ReportRepair.deleteThisWorkflowTheCategoryWillRemainWorkflowsReferenced'):['reply','description','satisfaction','evaluationLabel'].includes(actualKind)?$t('ReportRepair.deleteThisConfigurationHistoricalOrderDescriptionsAndReviewsWill'):$t('ReportRepair.deleteThisConfigurationReferencedConfigurationsCannotBeDeleted')" @confirm="remove(record)"><a-button type="link" danger :disabled="saving">{{$t('ReportRepair.delete')}}</a-button></a-popconfirm><a-button v-if="kind==='label'" type="link" @click="descriptions.show(record)">{{$t('ReportRepair.details')}}</a-button></template></a-table-column>
    </a-table>
    </div></div>
    </template>
    <a-modal :width="actualKind==='qr'?760:520" v-model:open="open" :title="(isFlow?flowEditing:!!form.id)?$t('ReportRepair.edit')+title:$t('ReportRepair.add')+title" :confirm-loading="saving" @ok="save">
      <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:12px" />
      <a-form ref="configurationFormRef" :model="form" layout="vertical">
        <a-form-item :label="$t('ReportRepair.project')" name="businessProjectId" :rules="[{required:true,message:$t('ReportRepair.selectAProject')}]"><a-select v-model:value="form.businessProjectId" :options="projectOptions" :disabled="!!form.id" /></a-form-item>
        <a-form-item v-if="!isFlow&&!['reply','description','commission'].includes(actualKind)" :label="nameLabel" name="name" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.enterAName')}]"><a-input v-model:value="form.name" :maxlength="actualKind==='qr'?40:actualKind==='channel'?24:128" /></a-form-item>
        <template v-if="isFlow">
          <a-form-item :label="$t('ReportRepair.issueCategory')" name="id" :rules="[{required:true,message:$t('ReportRepair.selectAnIssueCategory')}]"><a-tree-select :value="form.id" :tree-data="flowCategoryOptions" :field-names="{label:'label',value:'value',children:'children'}" tree-default-expand-all show-search tree-node-filter-prop="label" :placeholder="$t('ReportRepair.selectACategoryWithoutAWorkflow')" @change="selectFlowCategory" /></a-form-item>
          <a-form-item :label="$t('ReportRepair.workflowStatus')"><a-switch v-model:checked="form.configuration.flowEnabled" /></a-form-item>
          <RepairFlowFields :form="form" :roles="roleOptions" />
        </template>
        <a-form-item v-else-if="['channel','category','label','satisfaction'].includes(actualKind)" :label="$t('ReportRepair.status')" name="enabled" :rules="[{required:true,type:'boolean',message:$t('ReportRepair.selectAStatus')}]"><a-select :value="form.enabled===undefined?undefined:form.enabled?1:0" :options="[{value:1,label:$t('ReportRepair.enable')},{value:0,label:$t('ReportRepair.disabled')}]" :placeholder="$t('ReportRepair.selectAStatus')" @change="(value:unknown)=>form.enabled=Number(value)===1" /></a-form-item><a-form-item v-else-if="actualKind==='qr'" :label="$t('ReportRepair.enable')"><a-switch v-model:checked="form.enabled" /></a-form-item>
        <RepairQrFields v-if="actualKind==='qr'" :form="form" :options="qrOptions" />
        <RepairConfigurationFields v-else-if="!isFlow" :form="form" :kind="actualKind" :options="{leafCategory,parentTree,parents:parentOptions,roles:roleOptions,satisfactions:satisfactionOptions}" />
      </a-form>
    </a-modal>
    <RepairDescriptionDrawer :state="descriptions" :can-save="canSave" @close="descriptions.close" @refresh="descriptions.load" @edit="descriptions.edit" @toggle="descriptions.toggle" @remove="descriptions.remove" @save="descriptions.save" @cancel-edit="descriptions.editing=false" @page="descriptions.pageChange" @form-ref="setDescriptionFormRef" />
    <a-modal v-model:open="formSettings.open" :title="$t('ReportRepair.issueFormDisplaySettings')" :confirm-loading="formSettings.saving" :ok-button-props="{disabled:formSettings.loading}" @ok="formSettings.save">
      <a-alert v-if="formSettings.error" :message="formSettings.error" type="error" show-icon />
      <a-spin :spinning="formSettings.loading"><a-form layout="vertical">
        <a-form-item :label="$t('ReportRepair.project')" required><a-select v-model:value="formSettings.projectId" :options="projectOptions" :disabled="formSettings.saving" /></a-form-item>
        <a-form-item v-for="item in formSettings.fields" :key="item.key" :label="item.label"><a-switch v-model:checked="formSettings.form.configuration[item.key]" /></a-form-item>
      </a-form></a-spin>
    </a-modal>
    <a-modal :open="!!qrPreview" :title="$t('ReportRepair.issueQRCode')" :footer="null" @cancel="qrPreview=undefined">
      <template v-if="qrPreview"><div style="display:flex;justify-content:center"><a-qrcode :value="qr.publicLink(qrPreview)" :size="240" /></div><p style="margin-top:16px;overflow-wrap:anywhere">{{qr.publicLink(qrPreview)}}</p></template>
    </a-modal>
  </a-card>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import RepairWorkflowDiagram from '../../../components/RepairWorkflowDiagram.vue'
import { formatTime } from '../../../utils'
import RepairCategoryTree from '../../../components/RepairCategoryTree.vue'
import RepairDescriptionDrawer from '../../../components/RepairDescriptionDrawer.vue'
import RepairFlowFields from '../../../components/RepairFlowFields.vue'
import RepairQrFields from '../../../components/RepairQrFields.vue'
import RepairConfigurationFields from '../../../components/RepairConfigurationFields.vue'
import { useConfiguration } from '../../../hooks/useConfiguration'
import { commissionGroups, commissionRecipients } from '../../../services/configuration'
const { t: $t } = useI18n()
const { parentTree,nameLabel,activeTab,filterFields,filterTerms,search,roleName,formSettings,configurationFormRef,isFlow,flowEditing,flowEnabled,flowCategoryOptions,selectFlowCategory,qr,leafCategory,satisfactionOptions,toggle,remove,actualKind,parentOptions,parentName,roleOptions,descriptions,setDescriptionFormRef,categoryTreeState,selectCategory,addCategory,canSave,kind,title,rows,loading,saving,error,open,form,total,current,businessProjectId,projectOptions,projectName,load,edit,save,pageChange } = useConfiguration()
const {preview:qrPreview,options:qrOptions}=qr
</script>

<style scoped>
.configuration-layout{display:flex;align-items:flex-start;gap:20px}
.configuration-list{flex:1;min-width:0}
@media(max-width:1100px){.configuration-layout{flex-direction:column}.configuration-list{width:100%}}
</style>