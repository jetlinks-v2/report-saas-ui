<template>
  <a-card :title="title">
    <template #extra><a-space v-if="!isFlow||activeTab==='configuration'"><a-button v-if="canSave&&kind==='category'&&!isFlow" @click="formSettings.edit(businessProjectId)">表单显示设置</a-button><a-button @click="load">刷新</a-button><a-button v-if="canSave" type="primary" @click="edit()">新增</a-button></a-space></template>
    <a-tabs v-if="isFlow" v-model:active-key="activeTab"><a-tab-pane key="configuration" tab="报事流程配置" /><a-tab-pane key="diagram" tab="报事流程图" /></a-tabs>
    <img v-if="isFlow&&activeTab==='diagram'" :src="processDiagram" alt="报事流程图" style="display:block;width:100%;height:auto" />
    <template v-if="!isFlow||activeTab==='configuration'">
    <div class="configuration-layout">
    <RepairCategoryTree v-if="kind==='category'&&!isFlow" :state="categoryTreeState" @add="addCategory" @edit="edit" @remove="remove" @select="selectCategory" />
    <div class="configuration-list">
    <ConditionFilter v-if="filterFields.length" v-model="filterTerms" :fields="filterFields" @change="search" />
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
    <a-select v-model:value="businessProjectId" :options="projectOptions" placeholder="全部业务项目" allow-clear style="width:260px;margin-bottom:16px" />
    <a-table :scroll="{x:'max-content'}" :data-source="rows" :loading="loading" row-key="id" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
      <a-table-column key="project" title="业务项目"><template #default="{record}">{{projectName(record.businessProjectId)}}</template></a-table-column>
      <a-table-column v-if="!isFlow&&['category','label','description'].includes(actualKind)" key="parent" title="所属分类/标签"><template #default="{record}">{{parentName(record.parentId)}}</template></a-table-column>
      <a-table-column v-if="actualKind==='qr'" key="code" title="配置编码"><template #default="{record}">{{record.configuration.code}}</template></a-table-column>
      <a-table-column v-if="actualKind!=='commission'" key="name" :title="isFlow?'报事分类':nameLabel"><template #default="{record}"><div style="max-width:420px;white-space:pre-wrap">{{record.configuration.content||record.name}}</div></template></a-table-column>
      <template v-if="actualKind==='commission'">
        <template v-for="group in commissionGroups" :key="group.key">
          <a-table-column v-for="recipient in commissionRecipients" :key="group.key+recipient.key" :title="group.label+'-'+recipient.label+'抽佣比例'"><template #default="{record}">{{record.configuration[group.key]?.[recipient.key]??'—'}}%</template></a-table-column>
        </template>
      </template>
      <a-table-column v-if="actualKind==='satisfaction'" key="score" title="分值"><template #default="{record}">{{record.configuration.score}}</template></a-table-column>
      <a-table-column v-if="actualKind==='evaluationLabel'" key="satisfaction" title="级别"><template #default="{record}">{{parentName(record.configuration.satisfactionId)}}</template></a-table-column>
      <a-table-column v-if="actualKind==='reply'" key="node" title="报事处理节点"><template #default="{record}">{{({1:'正常完成',5:'跟进',7:'非正常完成'} as Record<number,string>)[record.configuration.staticNode]||'待配置'}}</template></a-table-column>
      <a-table-column v-if="!isFlow&&['category','label','description'].includes(actualKind)" key="sort" title="排序" data-index="sortIndex" />
      <a-table-column v-if="actualKind==='level'" key="level" title="等级规则"><template #default="{record}"><a-tag :color="record.configuration.color">系数 {{record.configuration.coefficient}}</a-tag>{{record.configuration.auditRequired?'需审核':'无需审核'}}</template></a-table-column>
      <a-table-column v-if="isFlow" key="finishDays" title="完成时限(天)"><template #default="{record}">{{record.configuration.finishTimeLimitDays}}</template></a-table-column>
      <a-table-column v-if="isFlow" key="transfer" title="转派次数"><template #default="{record}">{{record.configuration.transferLimit}}</template></a-table-column>
      <a-table-column v-if="isFlow" key="delay" title="延期次数"><template #default="{record}">{{record.configuration.delayLimit}}</template></a-table-column>
      <template v-if="isFlow">
        <a-table-column key="flowCreator" title="操作人"><template #default="{record}">{{record.flowCreatorName||record.creatorName||'—'}}</template></a-table-column>
        <a-table-column key="autoDispatch" title="自动分派"><template #default="{record}">{{record.configuration.autoDispatchEnable?'开启':'关闭'}}</template></a-table-column>
        <a-table-column key="dispatchMinutes" title="时长(分钟)"><template #default="{record}">{{record.configuration.autoDispatchEnable?record.configuration.autoDispatchMinutes:'—'}}</template></a-table-column>
        <a-table-column key="dispatchRole" title="分派角色"><template #default="{record}">{{record.configuration.autoDispatchEnable?roleName(record,'autoDispatchRoleId'):'—'}}</template></a-table-column>
        <a-table-column key="followRole" title="跟进处理角色"><template #default="{record}">{{roleName(record,'followRoleId')}}</template></a-table-column>
        <a-table-column key="callbackRequired" title="是否回访"><template #default="{record}">{{record.configuration.callbackRequired?'是':'否'}}</template></a-table-column>
        <a-table-column key="callbackRole" title="回访角色"><template #default="{record}">{{record.configuration.callbackRequired?roleName(record,'callbackRoleId'):'—'}}</template></a-table-column>
        <a-table-column key="levelRole" title="等级变更审核角色"><template #default="{record}">{{roleName(record,'levelChangeRoleId')}}</template></a-table-column>
        <a-table-column key="flowTime" title="更新时间"><template #default="{record}">{{formatTime(record.flowModifyTime??record.modifyTime)}}</template></a-table-column>
      </template>
      <a-table-column v-if="!isFlow" key="creator" title="操作人" data-index="creatorName" />
      <a-table-column v-if="!isFlow" key="modified" title="更新时间"><template #default="{record}">{{formatTime(record.modifyTime)}}</template></a-table-column>
      <a-table-column v-if="actualKind!=='reply'" key="enabled" :title="isFlow?'流程状态':'状态'"><template #default="{record}"><a-tag :color="(isFlow?flowEnabled(record):record.enabled)?'green':'default'">{{(isFlow?flowEnabled(record):record.enabled)?'启用':'停用'}}</a-tag></template></a-table-column>
      <a-table-column key="action" title="操作"><template #default="{record}"><template v-if="actualKind==='qr'"><a-button type="link" @click="qrPreview=record">二维码</a-button><a-button type="link" @click="qr.copyLink(record)">复制链接</a-button></template><a-button v-if="canSave" type="link" @click="edit(record)">编辑</a-button><a-button v-if="canSave&&actualKind!=='reply'" type="link" :disabled="saving" @click="toggle(record)">{{(isFlow?flowEnabled(record):record.enabled)?'停用':'启用'}}</a-button><a-popconfirm v-if="canSave&&(['category','commission','reply'].includes(actualKind)&&!isFlow||(isFlow?!flowEnabled(record):!record.enabled))" :title="isFlow?'删除流程配置？报事分类保留，已有工单引用时拒绝删除。':['reply','description','satisfaction','evaluationLabel'].includes(actualKind)?'删除此配置？历史工单正文和评价保留。':'删除此配置？已被引用的配置会拒绝删除。'" @confirm="remove(record)"><a-button type="link" danger :disabled="saving">删除</a-button></a-popconfirm><a-button v-if="kind==='label'" type="link" @click="descriptions.show(record)">详情</a-button></template></a-table-column>
    </a-table>
    </div></div>
    </template>
    <a-modal :width="actualKind==='qr'?760:520" v-model:open="open" :title="(isFlow?flowEditing:!!form.id)?'编辑'+title:'新增'+title" :confirm-loading="saving" @ok="save">
      <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:12px" />
      <a-form ref="configurationFormRef" :model="form" layout="vertical">
        <a-form-item label="业务项目" name="businessProjectId" :rules="[{required:true,message:'请选择业务项目'}]"><a-select v-model:value="form.businessProjectId" :options="projectOptions" :disabled="!!form.id" /></a-form-item>
        <a-form-item v-if="!isFlow&&!['reply','description','commission'].includes(actualKind)" :label="nameLabel" name="name" :rules="[{required:true,whitespace:true,message:'请填写名称'}]"><a-input v-model:value="form.name" :maxlength="actualKind==='qr'?40:actualKind==='channel'?24:128" /></a-form-item>
        <template v-if="isFlow">
          <a-form-item label="报事分类" name="id" :rules="[{required:true,message:'请选择报事分类'}]"><a-tree-select :value="form.id" :tree-data="flowCategoryOptions" :field-names="{label:'label',value:'value',children:'children'}" tree-default-expand-all show-search tree-node-filter-prop="label" placeholder="请选择尚未配置流程的分类" @change="selectFlowCategory" /></a-form-item>
          <a-form-item label="流程状态"><a-switch v-model:checked="form.configuration.flowEnabled" /></a-form-item>
          <RepairFlowFields :form="form" :roles="roleOptions" />
        </template>
        <a-form-item v-else-if="['channel','category','label','satisfaction'].includes(actualKind)" label="状态" name="enabled" :rules="[{required:true,type:'boolean',message:'请选择状态'}]"><a-select :value="form.enabled===undefined?undefined:form.enabled?1:0" :options="[{value:1,label:'启用'},{value:0,label:'禁用'}]" placeholder="请选择状态" @change="(value:unknown)=>form.enabled=Number(value)===1" /></a-form-item><a-form-item v-else-if="actualKind==='qr'" label="启用"><a-switch v-model:checked="form.enabled" /></a-form-item>
        <RepairQrFields v-if="actualKind==='qr'" :form="form" :options="qrOptions" />
        <RepairConfigurationFields v-else-if="!isFlow" :form="form" :kind="actualKind" :options="{leafCategory,parentTree,parents:parentOptions,roles:roleOptions,satisfactions:satisfactionOptions}" />
      </a-form>
    </a-modal>
    <RepairDescriptionDrawer :state="descriptions" :can-save="canSave" @close="descriptions.close" @refresh="descriptions.load" @edit="descriptions.edit" @toggle="descriptions.toggle" @remove="descriptions.remove" @save="descriptions.save" @cancel-edit="descriptions.editing=false" @page="descriptions.pageChange" @form-ref="setDescriptionFormRef" />
    <a-modal v-model:open="formSettings.open" title="报事表单显示设置" :confirm-loading="formSettings.saving" :ok-button-props="{disabled:formSettings.loading}" @ok="formSettings.save">
      <a-alert v-if="formSettings.error" :message="formSettings.error" type="error" show-icon />
      <a-spin :spinning="formSettings.loading"><a-form layout="vertical">
        <a-form-item label="业务项目" required><a-select v-model:value="formSettings.projectId" :options="projectOptions" :disabled="formSettings.saving" /></a-form-item>
        <a-form-item v-for="item in formSettings.fields" :key="item.key" :label="item.label"><a-switch v-model:checked="formSettings.form.configuration[item.key]" /></a-form-item>
      </a-form></a-spin>
    </a-modal>
    <a-modal :open="!!qrPreview" title="报事二维码" :footer="null" @cancel="qrPreview=undefined">
      <template v-if="qrPreview"><div style="display:flex;justify-content:center"><a-qrcode :value="qr.publicLink(qrPreview)" :size="240" /></div><p style="margin-top:16px;overflow-wrap:anywhere">{{qr.publicLink(qrPreview)}}</p></template>
    </a-modal>
  </a-card>
</template>
<script setup lang="ts">
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import processDiagram from '../../../assets/repair-process.png'
import { formatTime } from '../../../utils'
import RepairCategoryTree from '../../../components/RepairCategoryTree.vue'
import RepairDescriptionDrawer from '../../../components/RepairDescriptionDrawer.vue'
import RepairFlowFields from '../../../components/RepairFlowFields.vue'
import RepairQrFields from '../../../components/RepairQrFields.vue'
import RepairConfigurationFields from '../../../components/RepairConfigurationFields.vue'
import { useConfiguration } from '../../../hooks/useConfiguration'
import { commissionGroups, commissionRecipients } from '../../../services/configuration'
const { parentTree,nameLabel,activeTab,filterFields,filterTerms,search,roleName,formSettings,configurationFormRef,isFlow,flowEditing,flowEnabled,flowCategoryOptions,selectFlowCategory,qr,leafCategory,satisfactionOptions,toggle,remove,actualKind,parentOptions,parentName,roleOptions,descriptions,setDescriptionFormRef,categoryTreeState,selectCategory,addCategory,canSave,kind,title,rows,loading,saving,error,open,form,total,current,businessProjectId,projectOptions,projectName,load,edit,save,pageChange } = useConfiguration()
const {preview:qrPreview,options:qrOptions}=qr
</script>

<style scoped>
.configuration-layout{display:flex;align-items:flex-start;gap:20px}
.configuration-list{flex:1;min-width:0}
@media(max-width:1100px){.configuration-layout{flex-direction:column}.configuration-list{width:100%}}
</style>
