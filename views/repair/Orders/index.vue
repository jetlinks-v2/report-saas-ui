<template>
  <RepairCreate v-if="intake.open" :model="intake.form" :options="{flags:intake.formFlags,deviceEnabled:intake.deviceEnabled,devices:intake.deviceOptions,deviceLoading:intake.deviceLoading,deviceError:intake.deviceError,projects:projectOptions,categories:intake.tree,channels:intake.channelOptions,labels:intake.labels,descriptions:intake.descriptions,spaces:intake.spaceOptions,path:intake.path,loading:intake.loading,uploading:intake.uploading}" :saving="intake.saving" :error="error" @device-search="intake.searchDevices" @submit="intake.submit" @cancel="intake.open=false" @category="intake.path=$event" @description="intake.updateDescription" @uploading="intake.uploading=$event" />
  <a-card v-else :title="auditMode?'报事审核':'报事记录'">
    <template #extra><a-space><a-button :loading="loading" @click="load">刷新</a-button><a-button v-if="can('export')" @click="startExport">导出数据</a-button><a-button v-if="!auditMode&&can('create')" type="primary" @click="startCreate">发起报事</a-button></a-space></template>
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
    <a-space style="margin-bottom:16px"><a-select v-model:value="businessProjectId" :options="projectOptions" placeholder="全部业务项目" allow-clear style="width:240px" @change="filter" /><template v-if="auditMode"><a-select v-model:value="reviewStatus" :options="[{value:1,label:'待审核'},{value:2,label:'已通过'},{value:3,label:'不通过'}]" allow-clear placeholder="全部审核状态" style="width:180px" @change="filter" /><a-select v-model:value="reviewKind" :options="Object.entries(reviewNames).map(([value,label])=>({value,label}))" allow-clear placeholder="全部审核类型" style="width:180px" @change="filter" /></template><a-select v-else v-model:value="status" :options="statusNames.map((label,value)=>({label,value}))" placeholder="全部状态" allow-clear style="width:180px" @change="filter" /></a-space>
    <ConditionFilter v-model="searchTerms" :fields="filterFields" @change="search" />
    <a-radio-group v-if="!auditMode" :value="status===undefined?'all':String(status)" style="display:flex;flex-wrap:wrap;margin:16px 0" @change="changeStatusTab($event.target.value)">
      <a-radio-button v-for="tab in orderStatusTabs" :key="tab.value" :value="tab.value">{{tab.label}}（{{counts?.[tab.value]??'—'}}）</a-radio-button>
    </a-radio-group>
    <a-table :scroll="{x:'max-content'}" :data-source="rows" :loading="loading"  :row-key="auditMode?'reviewId':'id'" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
      <a-table-column key="createTime" title="报事时间" :width="190"><template #default="{record}">{{formatTime(record.createTime)}}</template></a-table-column>
      <a-table-column key="number" title="报事编号" :width="260"><template #default="{record}"><a-button type="link" @click="showDetail(record)">{{record.number}}</a-button></template></a-table-column>
      <a-table-column key="businessProject" title="项目名称" data-index="businessProjectName" :width="220" />
      <a-table-column key="status" title="状态" :width="110"><template #default="{record}"><a-tag :color="record.status===5?'green':'blue'">{{statusNames[record.status]}}</a-tag></template></a-table-column>
      <a-table-column key="category" title="报事分类" data-index="categoryName" />
      <a-table-column key="title" title="报事描述" :width="280"><template #default="{record}"><a-button type="link" @click="showDetail(record)">{{record.title}}</a-button></template></a-table-column>
      <a-table-column key="room" title="房屋信息" data-index="spaceName" :width="220" />
      <a-table-column key="totalAmount" title="工单总金额" :width="140"><template #default="{record}">{{record.paid?record.totalAmount??'—':'—'}}</template></a-table-column>
      <a-table-column key="personAmount" title="员工抽佣金额" :width="140"><template #default="{record}">{{record.paid?record.personAmount??'—':'—'}}</template></a-table-column>
      <a-table-column key="providerAmount" title="供方抽佣金额" :width="140"><template #default="{record}">{{record.paid?record.providerAmount??'—':'—'}}</template></a-table-column>
      <template v-if="auditMode">
        <a-table-column key="reviewKind" title="审核类型"><template #default="{record}">{{reviewNames[record.reviewKind]}}</template></a-table-column>
        <a-table-column key="reviewStatus" title="审核状态"><template #default="{record}">{{({1:'待审核',2:'已通过',3:'不通过'} as Record<number,string>)[record.reviewStatus]}}</template></a-table-column>
        <a-table-column key="reviewApplicantName" title="申请人" data-index="reviewApplicantName" />
        <a-table-column key="reviewReason" title="申请原因" data-index="reviewReason" />
        <a-table-column key="reviewCreateTime" title="申请时间"><template #default="{record}">{{formatTime(record.reviewCreateTime)}}</template></a-table-column>
      </template>
      <a-table-column key="contact" title="报事人" data-index="contactName" />
      <a-table-column key="phone" title="联系方式" data-index="contactPhone" />
      <a-table-column key="channel" title="报事渠道" data-index="channelName" />
      <a-table-column key="source" title="报事来源"><template #default="{record}">{{record.source||'—'}}</template></a-table-column>
      <a-table-column key="position" title="报事位置"><template #default="{record}">{{record.positionType===2?'室内':'公区'}}</template></a-table-column>
      <a-table-column key="assignee" title="责任人" data-index="assignedUserName" />
      <a-table-column key="deadline" title="完成时限" :width="190"><template #default="{record}">{{formatTime(record.finishDeadline)}}</template></a-table-column>
      <a-table-column key="urgency" title="紧急程度"><template #default="{record}">{{['—','一般','紧急','非常紧急'][record.urgency||0]}}</template></a-table-column>
      <a-table-column key="level" title="报事等级"><template #default="{record}"><a-badge v-if="record.levelName" :color="record.levelColor||'#999'" :text="record.levelName" /><template v-else>—</template></template></a-table-column>
    </a-table>
    <a-drawer v-model:open="detailOpen" title="报事详情" width="1000">
      <template v-if="selected">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="工单编号">{{selected.number}}</a-descriptions-item><a-descriptions-item label="状态">{{statusNames[selected.status]}}</a-descriptions-item>
          <a-descriptions-item label="业务项目">{{selected.businessProjectName}}</a-descriptions-item><a-descriptions-item label="处理人">{{selected.assignedUserName||(selected.candidateRoleId?'角色候选池待接单':'待分派')}}</a-descriptions-item>
          <a-descriptions-item label="分类">{{selected.categoryName}}</a-descriptions-item><a-descriptions-item label="渠道">{{selected.channelName}}</a-descriptions-item>
          <a-descriptions-item label="报事来源">{{selected.source||'—'}}</a-descriptions-item><a-descriptions-item label="报事位置">{{selected.positionType===2?'室内':selected.positionType===1?'公区':'—'}}</a-descriptions-item><a-descriptions-item label="紧急程度">{{['—','一般','紧急','非常紧急'][selected.urgency||0]}}</a-descriptions-item><a-descriptions-item label="房间号">{{selected.spaceName||'—'}}</a-descriptions-item><a-descriptions-item label="报事标签" :span="2">{{selected.labelNames?.join('、')||'—'}}</a-descriptions-item><a-descriptions-item label="报事内容" :span="2">{{selected.description}}</a-descriptions-item>
          <a-descriptions-item label="报事人">{{selected.contactName}}</a-descriptions-item><a-descriptions-item label="联系方式">{{selected.contactPhone}}</a-descriptions-item>
          <a-descriptions-item v-if="selected.deviceId" label="关联设备">{{selected.deviceName}}（{{selected.deviceId}}）</a-descriptions-item><a-descriptions-item v-if="selected.deviceId" label="设备产品">{{selected.deviceProductName||selected.deviceProductId||'—'}}</a-descriptions-item>
          <a-descriptions-item label="等级">{{selected.levelName||'待确定'}}</a-descriptions-item><a-descriptions-item label="处理时限">{{formatTime(selected.finishDeadline)}}</a-descriptions-item>
          <a-descriptions-item label="具体位置" :span="2">{{selected.location||'—'}}</a-descriptions-item>
          <a-descriptions-item label="报事登记人">{{selected.creatorName||'—'}}</a-descriptions-item><a-descriptions-item label="报事时间">{{formatTime(selected.createTime)}}</a-descriptions-item>
          <a-descriptions-item label="完成时间">{{formatTime(selected.finishTime)}}</a-descriptions-item><a-descriptions-item label="归档时间">{{formatTime(selected.archiveTime)}}</a-descriptions-item>
          <a-descriptions-item label="超时状态">{{selected.timedOut?'已超时':'未超时'}}</a-descriptions-item><a-descriptions-item v-if="selected.abandonTime" label="废弃时间">{{formatTime(selected.abandonTime)}}</a-descriptions-item>
          <a-descriptions-item v-if="selected.abandonReason" label="废弃原因" :span="2">{{selected.abandonReason}}</a-descriptions-item>
          <template v-if="selected.paid">
            <a-descriptions-item label="有偿报事">是</a-descriptions-item><a-descriptions-item label="业主签字">{{selected.signed?'已登记':selected.signatureRequested?'待签字':'待提交费用'}}</a-descriptions-item>
            <a-descriptions-item v-if="selected.signed" label="签字业主">{{selected.signatureOwnerName}} · {{selected.signatureOwnerPhone}}</a-descriptions-item><a-descriptions-item v-if="selected.signed" label="签字登记人">{{selected.signatureRecorderName||selected.signatureRecorderId}}</a-descriptions-item>
            <a-descriptions-item label="材料费">{{selected.materialAmount??'—'}}</a-descriptions-item><a-descriptions-item label="人工费">{{selected.artificialAmount??'—'}}</a-descriptions-item>
            <a-descriptions-item label="合计费用">{{selected.totalAmount??'—'}}</a-descriptions-item><a-descriptions-item label="责任人抽佣">{{selected.personAmount??'—'}}</a-descriptions-item>
            <a-descriptions-item label="供方抽佣">{{selected.providerAmount??'—'}}</a-descriptions-item><a-descriptions-item label="物业抽佣">{{selected.propertyAmount??'—'}}</a-descriptions-item>
          </template>
          <a-descriptions-item label="员工评价">{{selected.staffEvaluated?(selected.staffSatisfactionName||'满意度')+'（'+selected.staffSatisfaction+'分）':'未评价'}}</a-descriptions-item><a-descriptions-item label="业主评价">{{selected.ownerEvaluated?(selected.ownerSatisfactionName||'满意度')+'（'+selected.ownerSatisfaction+'分）':'未登记'}}</a-descriptions-item>
          <a-descriptions-item v-if="selected.ownerEvaluated" label="评价业主">{{selected.evaluationOwnerName}} · {{selected.evaluationOwnerPhone}}</a-descriptions-item><a-descriptions-item v-if="selected.ownerEvaluated" label="评价登记人">{{selected.ownerEvaluationRecorderName||selected.ownerEvaluationRecorderId}}</a-descriptions-item>
        </a-descriptions>
        <a-divider orientation="left">报事附件</a-divider><RepairAttachments :value="selected.attachmentIds||[]" disabled />
        <a-space wrap style="margin:20px 0"><a-button v-for="name in availableActions" :key="name" type="primary" @click="startAction(name)">{{actionNames[name]}}</a-button><a-button v-if="canPrint" @click="startPrint">打印</a-button></a-space>
        <a-divider v-if="reviews.length" orientation="left">审核申请</a-divider>
        <a-list v-if="reviews.length" :data-source="reviews"><template #renderItem="{item}"><a-list-item>{{reviewNames[item.kind]}} · {{item.status===1?'待审核':item.status===2?'通过':'不通过'}} · {{item.reason||item.opinion||'—'}}</a-list-item></template></a-list>
        <a-divider orientation="left">处理记录</a-divider><RepairProcessTimeline :records="history" />
      </template>
    </a-drawer>
    <a-modal v-model:open="actionOpen" :title="actionNames[action]" :confirm-loading="saving" :ok-button-props="{disabled:actionUploading}" width="720px" @ok="submitAction">
      <RepairActionForm ref="actionFormRef" v-if="selected" :form="actionForm" :action="action" :order="selected" :options="{readOnly:completionReadOnly,completionTypes,categoryTree:actionCategoryTree,categoryPath:actionCategoryPath,people:personOptions,levels:configOptions('level'),categories:categoryOptions,labels:labelOptions,satisfactions,evaluationLabels:evaluationLabelOptions,replies:replyOptions,reviews}" @uploading="actionUploading=$event" @completion-type="changeCompletionType" />
      <a-alert v-if="error" :message="error" type="error" show-icon />
    </a-modal>
    <a-modal v-model:open="exportOpen" title="导出管理" :confirm-loading="exporting" :cancel-button-props="{disabled:exporting}" :closable="!exporting" :mask-closable="!exporting" @ok="exportOrders">
      <a-form layout="vertical"><a-form-item label="导出选择"><a-radio-group v-model:value="exportScope"><a-radio value="all">全部导出</a-radio><a-radio value="current">按当前条件导出</a-radio></a-radio-group></a-form-item></a-form>
      <p>全部导出：导出当前应用内有权访问的全部{{auditMode?'审核记录':'报事'}}。</p><p>按当前条件导出：按列表中的搜索条件、业务项目和{{auditMode?'审核类型及审核状态':'工单状态'}}导出。</p><p>一次最多导出200000条，请通过条件查询分批导出。文件生成后可在“导出管理”下载。</p>
      <a-alert v-if="exportError" :message="exportError" type="error" show-icon />
    </a-modal>
    <a-modal v-model:open="printOpen" title="打印工单" width="1000px">
      <div v-if="selected" ref="printElement"><RepairPrintSheet :order="selected" :history="history" :reviews="reviews" /></div>
      <template #footer><a-button @click="printOpen=false">关闭</a-button><a-button type="primary" @click="printSelected">打印</a-button></template>
    </a-modal>
  </a-card>
</template>
<script setup lang="ts">
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import RepairCreate from '../../../components/RepairCreate.vue'
import RepairAttachments from '../../../components/RepairAttachments.vue'
import RepairActionForm from '../../../components/RepairActionForm.vue'
import RepairProcessTimeline from '../../../components/RepairProcessTimeline.vue'
import RepairPrintSheet from '../../../components/RepairPrintSheet.vue'
import { useOrders } from '../../../hooks/useOrders'
import { statusNames, actionNames, reviewNames, formatTime } from '../../../utils'
const {counts,orderStatusTabs,changeStatusTab,exportOpen,exportScope,exporting,exportError,startExport,exportOrders,canPrint,printOpen,printElement,startPrint,printSelected,searchTerms,actionFormRef,completionReadOnly,completionTypes,actionCategoryTree,actionCategoryPath,changeCompletionType,auditMode,reviewStatus,reviewKind,satisfactions,evaluationLabelOptions,replyOptions,filterFields,search,actionUploading,categoryOptions,labelOptions,intake,rows,total,current,loading,saving,error,businessProjectId,status,projectOptions,personOptions,configOptions,can,availableActions,detailOpen,actionOpen,selected,history,reviews,action,actionForm,load,pageChange,filter,startCreate,showDetail,startAction,submitAction} = useOrders()
</script>
