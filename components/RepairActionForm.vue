<template>
  <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{span:5}" :wrapper-col="{span:19}">
    <a-form-item v-if="['finish','quote','close'].includes(action)" :label="$t('ReportRepair.closureType')" required><a-select :value="action==='close'?'close':'finish'" :disabled="order.paid||options.readOnly" :options="options.completionTypes" @update:value="emit('completionType',$event)" /></a-form-item>
    <template v-if="action==='quote'||(action==='finish'&&order.paid)">
      <a-form-item :label="$t('ReportRepair.materialCost')" :name="action==='quote'?'materialAmount':undefined" :required="action==='quote'"><a-input-number v-model:value="form.materialAmount" :disabled="action==='finish'" :min="0" :precision="2" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.laborCost')" :name="action==='quote'?'artificialAmount':undefined" :required="action==='quote'"><a-input-number v-model:value="form.artificialAmount" :disabled="action==='finish'" :min="0" :precision="2" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.totalCost')">{{((Number(form.materialAmount)||0)+(Number(form.artificialAmount)||0)).toFixed(2)}}{{$t('ReportRepair.cny')}}</a-form-item>
    </template>
    <template v-if="['sign','ownerEvaluate'].includes(action)">
      <a-form-item :label="$t('ReportRepair.ownerName')" name="ownerName" required><a-input v-model:value="form.ownerName" :maxlength="128" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.ownerContactInformation')" name="ownerPhone" required><a-input v-model:value="form.ownerPhone" :maxlength="64" /></a-form-item>
      <a-form-item v-if="action==='sign'" :label="$t('ReportRepair.ownerSignatureImage')" name="signatureFileId" required><FileUpload v-model:value="form.signatureFileId" accept="image/*" :max-count="1" :multiple="false" :btn-text="$t('ReportRepair.uploadSignatureImage')" /></a-form-item>
    </template>
    <a-form-item v-if="['dispatch','transfer'].includes(action)" :label="$t('ReportRepair.assignee')" name="assignedUserId" required><a-select v-model:value="form.assignedUserId" :options="options.people" show-search option-filter-prop="label" /></a-form-item>
    <template v-if="(action==='follow'&&order.status===7)||action==='changeLevel'">
      <a-form-item :label="$t('ReportRepair.issuePriority')" name="levelId" required><a-select v-model:value="form.levelId" :options="options.levels" /></a-form-item>
    </template>
    <template v-if="action==='changeCategory'">
      <a-form-item :label="$t('ReportRepair.issueCategory')" name="categoryId" required><a-cascader :value="options.categoryPath" :options="options.categoryTree" :placeholder="$t('ReportRepair.selectAThirdLevelIssueCategory')" @change="form.categoryId=($event as string[]).at(-1)" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.issueTags')" name="labelIds" required><a-select v-model:value="form.labelIds" :options="options.labels" mode="multiple" /></a-form-item>
    </template>
    <template v-if="action==='delay'">
      <a-form-item :label="$t('ReportRepair.assignee')">{{order.assignedUserName}}</a-form-item>
      <a-form-item :label="$t('ReportRepair.completionDeadline')">{{formatTime(order.finishDeadline)}}</a-form-item>
      <a-form-item :label="$t('ReportRepair.extendDeadlineTo')" name="delayUntil" required><a-date-picker :value="form.delayUntil?dayjs(form.delayUntil):undefined" show-time @update:value="form.delayUntil=$event?.valueOf()" /></a-form-item>
    </template>
    <template v-if="action==='review'">
      <a-form-item :label="$t('ReportRepair.reviewRequests')" name="reviewId" required><a-select v-model:value="form.reviewId" :options="options.reviews.filter(row=>row.status===1).map(row=>({value:row.id,label:reviewNames[row.kind]+' · '+row.applicantName}))" /></a-form-item>
      <a-descriptions v-for="row in options.reviews.filter(item=>item.id===form.reviewId)" :key="row.id" :column="1" bordered size="small">
        <a-descriptions-item :label="$t('ReportRepair.reasonForRequest')">{{row.reason||'—'}}</a-descriptions-item>
        <a-descriptions-item v-if="row.delayUntil" :label="$t('ReportRepair.extendDeadlineTo')">{{formatTime(row.delayUntil)}}</a-descriptions-item>
        <a-descriptions-item v-if="row.targetLevel" :label="$t('ReportRepair.targetIssuePriority')">{{row.targetLevel.name}}</a-descriptions-item>
      </a-descriptions>
      <a-form-item :label="$t('ReportRepair.reviewResult')" name="approved" required><a-radio-group v-model:value="form.approved"><a-radio :value="true">{{$t('ReportRepair.approve')}}</a-radio><a-radio :value="false">{{$t('ReportRepair.rejected')}}</a-radio></a-radio-group></a-form-item>
    </template>
    <template v-if="action==='callback'">
      <a-form-item :label="$t('ReportRepair.followUpVisitMethod')" name="callbackMethod" required><a-radio-group v-model:value="form.callbackMethod"><a-radio v-for="(label,value) in callbackMethodNames" :key="value" :value="value">{{label}}</a-radio></a-radio-group></a-form-item>
      <a-form-item :label="$t('ReportRepair.followUpVisitResult')" name="callbackResult" required><a-radio-group v-model:value="form.callbackResult"><a-radio value="有效">{{$t('ReportRepair.valid')}}</a-radio><a-radio value="无效">{{$t('ReportRepair.invalid')}}</a-radio></a-radio-group></a-form-item>
      <a-form-item :label="$t('ReportRepair.followUpVisitTime')" name="callbackTime" required><a-date-picker :value="form.callbackTime?dayjs(form.callbackTime):undefined" show-time @update:value="form.callbackTime=$event?.valueOf()" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.followUpVisitor')" name="callbackPerson" required><a-input v-model:value="form.callbackPerson" :maxlength="128" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.followUpVisitPassed')" name="rework" required><a-radio-group v-model:value="form.rework"><a-radio :value="false">{{$t('ReportRepair.passedArchive')}}</a-radio><a-radio :value="true">{{$t('ReportRepair.failedRework')}}</a-radio></a-radio-group></a-form-item>
    </template>
    <a-form-item v-if="['callback','evaluate','ownerEvaluate'].includes(action)" :label="action==='callback'?$t('ReportRepair.satisfaction'):$t('ReportRepair.serviceRating')" name="satisfactionId" required><template v-if="options.satisfactions.length"><a-rate :value="Math.max(0,options.satisfactions.findIndex(row=>row.id===form.satisfactionId)+1)" :count="options.satisfactions.length" :allow-clear="false" :tooltips="options.satisfactions.map(row=>$t('ReportRepair.ratingOption', { p0: row.name, p1: row.configuration.score }))" @update:value="form.satisfactionId=options.satisfactions[$event-1]?.id" /><span style="margin-left:12px">{{options.satisfactions.find(row=>row.id===form.satisfactionId)?.name||$t('ReportRepair.select')}}{{form.satisfaction!==undefined?$t('ReportRepair.scoreOption', { p0: form.satisfaction }):''}}</span></template><a-empty v-else :description="$t('ReportRepair.configureAndEnableSatisfactionRatingsForThisProjectFirst')" :image="undefined" /></a-form-item>
    <a-form-item v-if="['evaluate','ownerEvaluate'].includes(action)" :label="$t('ReportRepair.ratingTags')"><a-select v-model:value="form.evaluationLabelIds" :options="options.evaluationLabels" mode="multiple" /></a-form-item>
    <a-form-item v-if="['delay','abandonApply','changeLevel'].includes(action)||(action==='review'&&!form.approved)" :label="action==='delay'?$t('ReportRepair.extensionReason'):action==='abandonApply'?$t('ReportRepair.discardReason'):action==='changeLevel'?$t('ReportRepair.remark'):$t('ReportRepair.rejectionReason')" name="reason" :required="action!=='changeLevel'"><a-textarea v-model:value="form.reason" :rows="3" :maxlength="reasonLimit" /></a-form-item>
    <a-form-item v-if="showContent" :label="content.label" name="description" :required="content.required"><a-textarea v-model:value="form.description" :rows="4" :maxlength="content.max" :disabled="options.readOnly" show-count /></a-form-item>
    <a-form-item v-if="['follow','finish','quote','close'].includes(action)" :label="$t('ReportRepair.reply')" name="replyId" :required="action!=='follow'"><a-select v-if="!options.readOnly" v-model:value="form.replyId" :options="options.replies" show-search option-filter-prop="label" allow-clear /><a-input v-else :value="form.reply" disabled /></a-form-item>
    <a-alert v-if="action==='follow'&&order.status===7" :message="$t('ReportRepair.uploadArrivalPhotosForTheFirstFollowUpThe')" type="info" show-icon style="margin-bottom:16px" />
    <a-form-item v-if="!['accept','grab','toPaid','changeCategory','changeLevel'].includes(action)" :label="$t('ReportRepair.attachments')" name="attachmentIds" :required="action==='follow'&&order.status===7"><RepairAttachments :disabled="options.readOnly" :value="form.attachmentIds||[]" @update:value="form.attachmentIds=$event" @busy="emit('uploading',$event)" /></a-form-item>
    <a-form-item v-if="options.readOnly&&order.signatureFileId" :label="$t('ReportRepair.ownerSignature')"><RepairAttachments :value="[order.signatureFileId]" disabled /></a-form-item>
  </a-form>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { callbackMethodNames } from '../services/actions'
import { FileUpload } from '@jetlinks-web-core/components'
import type { ActionInput, Order, Review, SelectOption, Configuration, CategoryOption } from '../types'
import { formatTime, reviewNames } from '../utils'
import RepairAttachments from './RepairAttachments.vue'
import { useRepairActionForm } from '../hooks/useRepairActionForm'
const { t: $t } = useI18n()
const props=defineProps<{ form:ActionInput; action:string; order:Order; options:{readOnly:boolean;completionTypes:SelectOption[];categoryTree:CategoryOption[];categoryPath:string[];satisfactions:Configuration[];people:SelectOption[];levels:SelectOption[];categories:SelectOption[];labels:SelectOption[];evaluationLabels:SelectOption[];replies:SelectOption[];reviews:Review[]} }>()
const emit=defineEmits<{uploading:[value:boolean];completionType:[action:string]}>()
const {formRef,rules,content,showContent,reasonLimit,validate,clearValidate}=useRepairActionForm(props)
defineExpose({validate,clearValidate})
</script>
