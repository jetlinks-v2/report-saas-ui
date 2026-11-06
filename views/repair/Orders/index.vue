<template>
  <RepairCreate v-if="intake.open" :model="intake.form" :options="{flags:intake.formFlags,deviceEnabled:intake.deviceEnabled,devices:intake.deviceOptions,deviceLoading:intake.deviceLoading,deviceError:intake.deviceError,projects:projectOptions,categories:intake.tree,channels:intake.channelOptions,labels:intake.labels,descriptions:intake.descriptions,spaces:intake.spaceOptions,path:intake.path,loading:intake.loading,uploading:intake.uploading}" :saving="intake.saving" :error="error" @device-search="intake.searchDevices" @submit="intake.submit" @cancel="intake.open=false" @category="intake.path=$event" @description="intake.updateDescription" @uploading="intake.uploading=$event" />
  <a-card v-else :title="auditMode?$t('ReportRepair.issueReviews'):$t('ReportRepair.issueRecords')">
    <template #extra><a-space><a-button v-if="can('export')" @click="startExport">{{$t('ReportRepair.exportData')}}</a-button><a-button v-if="!auditMode&&can('create')" type="primary" @click="startCreate">{{$t('ReportRepair.reportAnIssue')}}</a-button></a-space></template>
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
    <a-space style="margin-bottom:16px"><a-select v-model:value="businessProjectId" :options="projectOptions" :placeholder="$t('ReportRepair.allProjects')" allow-clear style="width:240px" @change="filter" /><template v-if="auditMode"><a-select v-model:value="reviewStatus" :options="[{value:1,label:$t('ReportRepair.pendingReview')},{value:2,label:$t('ReportRepair.approved')},{value:3,label:$t('ReportRepair.rejected')}]" allow-clear :placeholder="$t('ReportRepair.allReviewStatuses')" style="width:180px" @change="filter" /><a-select v-model:value="reviewKind" :options="Object.entries(reviewNames).map(([value,label])=>({value,label}))" allow-clear :placeholder="$t('ReportRepair.allReviewTypes')" style="width:180px" @change="filter" /></template><a-select v-else v-model:value="status" :options="statusNames.map((label,value)=>({label,value}))" :placeholder="$t('ReportRepair.allStatuses')" allow-clear style="width:180px" @change="filter" /></a-space>
    <ConditionFilter v-model="searchTerms" :fields="filterFields" @change="search" />
    <a-radio-group v-if="!auditMode" :value="status===undefined?'all':String(status)" style="display:flex;flex-wrap:wrap;margin:16px 0" @change="changeStatusTab($event.target.value)">
      <a-radio-button v-for="tab in orderStatusTabs" :key="tab.value" :value="tab.value">{{tab.label}}（{{counts?.[tab.value]??'—'}}）</a-radio-button>
    </a-radio-group>
    <a-table :scroll="{x:'max-content'}" :data-source="rows" :loading="loading"  :row-key="auditMode?'reviewId':'id'" :pagination="{current,total,pageSize:20,showSizeChanger:false}" @change="pageChange">
      <a-table-column key="createTime" :title="$t('ReportRepair.reported')" :width="190"><template #default="{record}">{{formatTime(record.createTime)}}</template></a-table-column>
      <a-table-column key="number" :title="$t('ReportRepair.issueNumber')" :width="260"><template #default="{record}"><a-button type="link" @click="showDetail(record)">{{record.number}}</a-button></template></a-table-column>
      <a-table-column key="businessProject" :title="$t('ReportRepair.projectName')" data-index="businessProjectName" :width="220" />
      <a-table-column key="status" :title="$t('ReportRepair.status')" :width="110"><template #default="{record}"><a-tag :color="record.status===5?'green':'blue'">{{statusNames[record.status]}}</a-tag></template></a-table-column>
      <a-table-column key="category" :title="$t('ReportRepair.issueCategory')" data-index="categoryName" />
      <a-table-column key="description" :title="$t('ReportRepair.issueDescription')" :width="280"><template #default="{record}"><a-button type="link" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;text-align:left" :title="record.description" @click="showDetail(record)">{{record.description||'—'}}</a-button></template></a-table-column>
      <a-table-column key="room" :title="$t('ReportRepair.houseInformation')" data-index="spaceName" :width="220" />
      <a-table-column key="totalAmount" :title="$t('ReportRepair.orderTotal')" :width="140"><template #default="{record}">{{record.paid?record.totalAmount??'—':'—'}}</template></a-table-column>
      <a-table-column key="personAmount" :title="$t('ReportRepair.employeeCommission')" :width="140"><template #default="{record}">{{record.paid?record.personAmount??'—':'—'}}</template></a-table-column>
      <a-table-column key="providerAmount" :title="$t('ReportRepair.providerCommissionAmount')" :width="140"><template #default="{record}">{{record.paid?record.providerAmount??'—':'—'}}</template></a-table-column>
      <template v-if="auditMode">
        <a-table-column key="reviewKind" :title="$t('ReportRepair.reviewType')"><template #default="{record}">{{reviewNames[record.reviewKind]}}</template></a-table-column>
        <a-table-column key="reviewStatus" :title="$t('ReportRepair.reviewStatus')"><template #default="{record}">{{({1:$t('ReportRepair.pendingReview'),2:$t('ReportRepair.approved'),3:$t('ReportRepair.rejected')} as Record<number,string>)[record.reviewStatus]}}</template></a-table-column>
        <a-table-column key="reviewApplicantName" :title="$t('ReportRepair.applicant')" data-index="reviewApplicantName" />
        <a-table-column key="reviewReason" :title="$t('ReportRepair.reasonForRequest')" data-index="reviewReason" />
        <a-table-column key="reviewCreateTime" :title="$t('ReportRepair.requested')"><template #default="{record}">{{formatTime(record.reviewCreateTime)}}</template></a-table-column>
      </template>
      <a-table-column key="contact" :title="$t('ReportRepair.reportedBy')" data-index="contactName" />
      <a-table-column key="phone" :title="$t('ReportRepair.contactInformation')" data-index="contactPhone" />
      <a-table-column key="channel" :title="$t('ReportRepair.reportingChannel')" data-index="channelName" />
      <a-table-column key="source" :title="$t('ReportRepair.issueSource')"><template #default="{record}">{{sourceName(record.source)}}</template></a-table-column>
      <a-table-column key="position" :title="$t('ReportRepair.issueLocation')"><template #default="{record}">{{record.positionType===2?$t('ReportRepair.indoors'):$t('ReportRepair.commonArea')}}</template></a-table-column>
      <a-table-column key="assignee" :title="$t('ReportRepair.assignee')" data-index="assignedUserName" />
      <a-table-column key="deadline" :title="$t('ReportRepair.completionDeadline')" :width="190"><template #default="{record}">{{formatTime(record.finishDeadline)}}</template></a-table-column>
      <a-table-column key="urgency" :title="$t('ReportRepair.urgency')"><template #default="{record}">{{['—',$t('ReportRepair.urgencyNormal'),$t('ReportRepair.urgent'),$t('ReportRepair.veryUrgent')][record.urgency||0]}}</template></a-table-column>
      <a-table-column key="level" :title="$t('ReportRepair.issuePriority')"><template #default="{record}"><a-badge v-if="record.levelName" :color="record.levelColor||'#999'" :text="record.levelName" /><template v-else>—</template></template></a-table-column>
    </a-table>
    <a-drawer v-model:open="detailOpen" :title="$t('ReportRepair.issueDetails')" width="1000">
      <template v-if="selected">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item :label="$t('ReportRepair.orderNumber')">{{selected.number}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.status')">{{statusNames[selected.status]}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.project')">{{selected.businessProjectName}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.handler')">{{selected.assignedUserName||(selected.candidateRoleId?$t('ReportRepair.awaitingAcceptanceByAnEligibleRoleMember'):$t('ReportRepair.awaitingAssignment'))}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.category')">{{selected.categoryName}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.channel')">{{selected.channelName}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.issueSource')">{{sourceName(selected.source)}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.issueLocation')">{{selected.positionType===2?$t('ReportRepair.indoors'):selected.positionType===1?$t('ReportRepair.commonArea'):'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.urgency')">{{['—',$t('ReportRepair.urgencyNormal'),$t('ReportRepair.urgent'),$t('ReportRepair.veryUrgent')][selected.urgency||0]}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.roomNumber')">{{selected.spaceName||'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.issueTags')" :span="2">{{selected.labelNames?.join('、')||'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.issueContent')" :span="2">{{selected.description}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.reportedBy')">{{selected.contactName}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.contactInformation')">{{selected.contactPhone}}</a-descriptions-item>
          <a-descriptions-item v-if="selected.deviceId" :label="$t('ReportRepair.linkedDevice')">{{selected.deviceName}}（{{selected.deviceId}}）</a-descriptions-item><a-descriptions-item v-if="selected.deviceId" :label="$t('ReportRepair.deviceProduct')">{{selected.deviceProductName||selected.deviceProductId||'—'}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.priority')">{{selected.levelName||$t('ReportRepair.toBeDetermined')}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.processingDeadline')">{{formatTime(selected.finishDeadline)}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.specificLocation')" :span="2">{{selected.location||'—'}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.recordedBy')">{{selected.creatorName||'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.reported')">{{formatTime(selected.createTime)}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.completed')">{{formatTime(selected.finishTime)}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.archived')">{{formatTime(selected.archiveTime)}}</a-descriptions-item>
          <a-descriptions-item :label="$t('ReportRepair.timeoutStatus')">{{selected.timedOut?$t('ReportRepair.overdue'):$t('ReportRepair.withinDeadline')}}</a-descriptions-item><a-descriptions-item v-if="selected.abandonTime" :label="$t('ReportRepair.discarded')">{{formatTime(selected.abandonTime)}}</a-descriptions-item>
          <a-descriptions-item v-if="selected.abandonReason" :label="$t('ReportRepair.discardReason')" :span="2">{{selected.abandonReason}}</a-descriptions-item>
          <template v-if="selected.paid">
            <a-descriptions-item :label="$t('ReportRepair.paidService')">{{$t('ReportRepair.yes')}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.ownerSignature')">{{selected.signed?$t('ReportRepair.recorded'):selected.signatureRequested?$t('ReportRepair.awaitingSignature'):$t('ReportRepair.awaitingCostSubmission')}}</a-descriptions-item>
            <a-descriptions-item v-if="selected.signed" :label="$t('ReportRepair.signingOwner')">{{selected.signatureOwnerName}} · {{selected.signatureOwnerPhone}}</a-descriptions-item><a-descriptions-item v-if="selected.signed" :label="$t('ReportRepair.signatureRecordedBy')">{{selected.signatureRecorderName||selected.signatureRecorderId}}</a-descriptions-item>
            <a-descriptions-item :label="$t('ReportRepair.materialCost')">{{selected.materialAmount??'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.laborCost')">{{selected.artificialAmount??'—'}}</a-descriptions-item>
            <a-descriptions-item :label="$t('ReportRepair.totalCost')">{{selected.totalAmount??'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.assigneeCommission')">{{selected.personAmount??'—'}}</a-descriptions-item>
            <a-descriptions-item :label="$t('ReportRepair.providerCommission')">{{selected.providerAmount??'—'}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.propertyCommission')">{{selected.propertyAmount??'—'}}</a-descriptions-item>
          </template>
          <a-descriptions-item :label="$t('ReportRepair.employeeRating')">{{selected.staffEvaluated?$t('ReportRepair.ratingWithScore', {name:selected.staffSatisfactionName||$t('ReportRepair.satisfaction'),score:selected.staffSatisfaction}):$t('ReportRepair.notRated')}}</a-descriptions-item><a-descriptions-item :label="$t('ReportRepair.ownerRating')">{{selected.ownerEvaluated?$t('ReportRepair.ratingWithScore', {name:selected.ownerSatisfactionName||$t('ReportRepair.satisfaction'),score:selected.ownerSatisfaction}):$t('ReportRepair.notRecorded')}}</a-descriptions-item>
          <a-descriptions-item v-if="selected.ownerEvaluated" :label="$t('ReportRepair.ratingOwner')">{{selected.evaluationOwnerName}} · {{selected.evaluationOwnerPhone}}</a-descriptions-item><a-descriptions-item v-if="selected.ownerEvaluated" :label="$t('ReportRepair.ratingRecordedBy')">{{selected.ownerEvaluationRecorderName||selected.ownerEvaluationRecorderId}}</a-descriptions-item>
        </a-descriptions>
        <a-divider orientation="left">{{$t('ReportRepair.issueAttachments')}}</a-divider><RepairAttachments :value="selected.attachmentIds||[]" disabled />
        <a-space wrap style="margin:20px 0"><a-button v-for="name in availableActions" :key="name" type="primary" @click="startAction(name)">{{actionNames[name]}}</a-button><a-button v-if="canPrint" @click="startPrint">{{$t('ReportRepair.print')}}</a-button></a-space>
        <a-divider v-if="reviews.length" orientation="left">{{$t('ReportRepair.reviewRequests')}}</a-divider>
        <a-list v-if="reviews.length" :data-source="reviews"><template #renderItem="{item}"><a-list-item>{{reviewNames[item.kind]}} · {{item.status===1?$t('ReportRepair.pendingReview'):item.status===2?$t('ReportRepair.approve'):$t('ReportRepair.rejected')}} · {{item.reason||item.opinion||'—'}}</a-list-item></template></a-list>
        <a-divider orientation="left">{{$t('ReportRepair.processingHistory')}}</a-divider><RepairProcessTimeline :records="history" />
      </template>
    </a-drawer>
    <a-modal v-model:open="actionOpen" :title="actionNames[action]" :confirm-loading="saving" :ok-button-props="{disabled:actionUploading||optionsLoading||optionsError}" width="720px" @ok="submitAction">
      <a-spin :spinning="optionsLoading"><RepairActionForm ref="actionFormRef" v-if="selected&&!optionsLoading" :form="actionForm" :action="action" :order="selected" :options="{readOnly:completionReadOnly,completionTypes,categoryTree:actionCategoryTree,categoryPath:actionCategoryPath,people:personOptions,peopleLoading,peopleError,levels:configOptions('level'),categories:categoryOptions,labels:labelOptions,satisfactions,evaluationLabels:evaluationLabelOptions,replies:replyOptions,reviews}" @assignee-search="searchAssignees" @uploading="actionUploading=$event" @completion-type="changeCompletionType" /></a-spin>
      <a-alert v-if="error" :message="error" type="error" show-icon />
    </a-modal>
    <a-modal v-model:open="exportOpen" :title="$t('ReportRepair.exports')" :confirm-loading="exporting" :cancel-button-props="{disabled:exporting}" :closable="!exporting" :mask-closable="!exporting" @ok="exportOrders">
      <a-form layout="vertical"><a-form-item :label="$t('ReportRepair.exportScope')"><a-radio-group v-model:value="exportScope"><a-radio value="all">{{$t('ReportRepair.exportAll')}}</a-radio><a-radio value="current">{{$t('ReportRepair.exportFilteredResults')}}</a-radio></a-radio-group></a-form-item></a-form>
      <p>{{$t('ReportRepair.exportAllHint', {type:auditMode?$t('ReportRepair.reviewRecords'):$t('ReportRepair.issues')})}}</p><p>{{$t('ReportRepair.exportFilteredHint', {filter:auditMode?$t('ReportRepair.reviewTypeAndStatus'):$t('ReportRepair.orderStatus')})}}</p><p>{{$t('ReportRepair.exportUpTo200000RecordsPerBatchNarrow')}}</p>
      <a-alert v-if="exportError" :message="exportError" type="error" show-icon />
    </a-modal>
    <a-modal v-model:open="printOpen" :title="$t('ReportRepair.printOrder')" width="1000px">
      <div v-if="selected" ref="printElement"><RepairPrintSheet :order="selected" :history="history" :reviews="reviews" /></div>
      <template #footer><a-button @click="printOpen=false">{{$t('ReportRepair.close')}}</a-button><a-button type="primary" @click="printSelected">{{$t('ReportRepair.print')}}</a-button></template>
    </a-modal>
  </a-card>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import RepairCreate from '../../../components/RepairCreate.vue'
import RepairAttachments from '../../../components/RepairAttachments.vue'
import RepairActionForm from '../../../components/RepairActionForm.vue'
import RepairProcessTimeline from '../../../components/RepairProcessTimeline.vue'
import RepairPrintSheet from '../../../components/RepairPrintSheet.vue'
import { useOrders } from '../../../hooks/useOrders'
import { statusNames, actionNames, reviewNames, formatTime, sourceName } from '../../../utils'
const { t: $t } = useI18n()
const {peopleError,peopleLoading,searchAssignees,optionsError,optionsLoading,counts,orderStatusTabs,changeStatusTab,exportOpen,exportScope,exporting,exportError,startExport,exportOrders,canPrint,printOpen,printElement,startPrint,printSelected,searchTerms,actionFormRef,completionReadOnly,completionTypes,actionCategoryTree,actionCategoryPath,changeCompletionType,auditMode,reviewStatus,reviewKind,satisfactions,evaluationLabelOptions,replyOptions,filterFields,search,actionUploading,categoryOptions,labelOptions,intake,rows,total,current,loading,saving,error,businessProjectId,status,projectOptions,personOptions,configOptions,can,availableActions,detailOpen,actionOpen,selected,history,reviews,action,actionForm,load,pageChange,filter,startCreate,showDetail,startAction,submitAction} = useOrders()
</script>