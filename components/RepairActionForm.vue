<template>
  <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{span:5}" :wrapper-col="{span:19}">
    <a-form-item v-if="['finish','quote','close'].includes(action)" label="关单类型" required><a-select :value="action==='close'?'close':'finish'" :disabled="order.paid||options.readOnly" :options="options.completionTypes" @update:value="emit('completionType',$event)" /></a-form-item>
    <template v-if="action==='quote'||(action==='finish'&&order.paid)">
      <a-form-item label="材料费" :name="action==='quote'?'materialAmount':undefined" :required="action==='quote'"><a-input-number v-model:value="form.materialAmount" :disabled="action==='finish'" :min="0" :precision="2" /></a-form-item>
      <a-form-item label="人工费" :name="action==='quote'?'artificialAmount':undefined" :required="action==='quote'"><a-input-number v-model:value="form.artificialAmount" :disabled="action==='finish'" :min="0" :precision="2" /></a-form-item>
      <a-form-item label="合计费用">{{((Number(form.materialAmount)||0)+(Number(form.artificialAmount)||0)).toFixed(2)}} 元</a-form-item>
    </template>
    <template v-if="['sign','ownerEvaluate'].includes(action)">
      <a-form-item label="业主姓名" name="ownerName" required><a-input v-model:value="form.ownerName" :maxlength="128" /></a-form-item>
      <a-form-item label="业主联系方式" name="ownerPhone" required><a-input v-model:value="form.ownerPhone" :maxlength="64" /></a-form-item>
      <a-form-item v-if="action==='sign'" label="业主签字图片" name="signatureFileId" required><FileUpload v-model:value="form.signatureFileId" accept="image/*" :max-count="1" :multiple="false" btn-text="上传签字图片" /></a-form-item>
    </template>
    <a-form-item v-if="['dispatch','transfer'].includes(action)" label="责任人" name="assignedUserId" required><a-select v-model:value="form.assignedUserId" :options="options.people" show-search option-filter-prop="label" /></a-form-item>
    <template v-if="(action==='follow'&&order.status===7)||action==='changeLevel'">
      <a-form-item label="报事等级" name="levelId" required><a-select v-model:value="form.levelId" :options="options.levels" /></a-form-item>
    </template>
    <template v-if="action==='changeCategory'">
      <a-form-item label="报事分类" name="categoryId" required><a-cascader :value="options.categoryPath" :options="options.categoryTree" placeholder="请选择第三级报事分类" @change="form.categoryId=($event as string[]).at(-1)" /></a-form-item>
      <a-form-item label="报事标签" name="labelIds" required><a-select v-model:value="form.labelIds" :options="options.labels" mode="multiple" /></a-form-item>
    </template>
    <template v-if="action==='delay'">
      <a-form-item label="责任人">{{order.assignedUserName}}</a-form-item>
      <a-form-item label="完成时限">{{formatTime(order.finishDeadline)}}</a-form-item>
      <a-form-item label="延期时间至" name="delayUntil" required><a-date-picker :value="form.delayUntil?dayjs(form.delayUntil):undefined" show-time @update:value="form.delayUntil=$event?.valueOf()" /></a-form-item>
    </template>
    <template v-if="action==='review'">
      <a-form-item label="审核申请" name="reviewId" required><a-select v-model:value="form.reviewId" :options="options.reviews.filter(row=>row.status===1).map(row=>({value:row.id,label:reviewNames[row.kind]+' · '+row.applicantName}))" /></a-form-item>
      <a-descriptions v-for="row in options.reviews.filter(item=>item.id===form.reviewId)" :key="row.id" :column="1" bordered size="small">
        <a-descriptions-item label="申请原因">{{row.reason||'—'}}</a-descriptions-item>
        <a-descriptions-item v-if="row.delayUntil" label="延期时间至">{{formatTime(row.delayUntil)}}</a-descriptions-item>
        <a-descriptions-item v-if="row.targetLevel" label="目标报事等级">{{row.targetLevel.name}}</a-descriptions-item>
      </a-descriptions>
      <a-form-item label="审核结果" name="approved" required><a-radio-group v-model:value="form.approved"><a-radio :value="true">通过</a-radio><a-radio :value="false">不通过</a-radio></a-radio-group></a-form-item>
    </template>
    <template v-if="action==='callback'">
      <a-form-item label="回访方式" name="callbackMethod" required><a-radio-group v-model:value="form.callbackMethod"><a-radio v-for="item in ['电话','登门','现场','短信']" :key="item" :value="item">{{item}}</a-radio></a-radio-group></a-form-item>
      <a-form-item label="回访结果" name="callbackResult" required><a-radio-group v-model:value="form.callbackResult"><a-radio value="有效">有效</a-radio><a-radio value="无效">无效</a-radio></a-radio-group></a-form-item>
      <a-form-item label="回访时间" name="callbackTime" required><a-date-picker :value="form.callbackTime?dayjs(form.callbackTime):undefined" show-time @update:value="form.callbackTime=$event?.valueOf()" /></a-form-item>
      <a-form-item label="回访人" name="callbackPerson" required><a-input v-model:value="form.callbackPerson" :maxlength="128" /></a-form-item>
      <a-form-item label="回访是否通过" name="rework" required><a-radio-group v-model:value="form.rework"><a-radio :value="false">通过（归档）</a-radio><a-radio :value="true">不通过（返工）</a-radio></a-radio-group></a-form-item>
    </template>
    <a-form-item v-if="['callback','evaluate','ownerEvaluate'].includes(action)" :label="action==='callback'?'满意度':'服务评价'" name="satisfactionId" required><template v-if="options.satisfactions.length"><a-rate :value="Math.max(0,options.satisfactions.findIndex(row=>row.id===form.satisfactionId)+1)" :count="options.satisfactions.length" :allow-clear="false" :tooltips="options.satisfactions.map(row=>`${row.name}（${row.configuration.score}分）`)" @update:value="form.satisfactionId=options.satisfactions[$event-1]?.id" /><span style="margin-left:12px">{{options.satisfactions.find(row=>row.id===form.satisfactionId)?.name||'请选择'}}{{form.satisfaction!==undefined?`（${form.satisfaction}分）`:''}}</span></template><a-empty v-else description="请先配置并启用该业务项目的满意度级别" :image="undefined" /></a-form-item>
    <a-form-item v-if="['evaluate','ownerEvaluate'].includes(action)" label="评价标签"><a-select v-model:value="form.evaluationLabelIds" :options="options.evaluationLabels" mode="multiple" /></a-form-item>
    <a-form-item v-if="['delay','abandonApply','changeLevel'].includes(action)||(action==='review'&&!form.approved)" :label="action==='delay'?'延期原因':action==='abandonApply'?'废弃原因':action==='changeLevel'?'备注':'不通过原因'" name="reason" :required="action!=='changeLevel'"><a-textarea v-model:value="form.reason" :rows="3" :maxlength="reasonLimit" /></a-form-item>
    <a-form-item v-if="showContent" :label="content.label" name="description" :required="content.required"><a-textarea v-model:value="form.description" :rows="4" :maxlength="content.max" :disabled="options.readOnly" show-count /></a-form-item>
    <a-form-item v-if="['follow','finish','quote','close'].includes(action)" label="回复语" name="replyId" :required="action!=='follow'"><a-select v-if="!options.readOnly" v-model:value="form.replyId" :options="options.replies" show-search option-filter-prop="label" allow-clear /><a-input v-else :value="form.reply" disabled /></a-form-item>
    <a-alert v-if="action==='follow'&&order.status===7" message="首次跟进需上传到场照片，提交后工单进入处理中" type="info" show-icon style="margin-bottom:16px" />
    <a-form-item v-if="!['accept','grab','toPaid','changeCategory','changeLevel'].includes(action)" label="附件" name="attachmentIds" :required="action==='follow'&&order.status===7"><RepairAttachments :disabled="options.readOnly" :value="form.attachmentIds||[]" @update:value="form.attachmentIds=$event" @busy="emit('uploading',$event)" /></a-form-item>
    <a-form-item v-if="options.readOnly&&order.signatureFileId" label="业主签字"><RepairAttachments :value="[order.signatureFileId]" disabled /></a-form-item>
  </a-form>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { FileUpload } from '@jetlinks-web-core/components'
import type { ActionInput, Order, Review, SelectOption, Configuration, CategoryOption } from '../types'
import { formatTime, reviewNames } from '../utils'
import RepairAttachments from './RepairAttachments.vue'
import { useRepairActionForm } from '../hooks/useRepairActionForm'
const props=defineProps<{ form:ActionInput; action:string; order:Order; options:{readOnly:boolean;completionTypes:SelectOption[];categoryTree:CategoryOption[];categoryPath:string[];satisfactions:Configuration[];people:SelectOption[];levels:SelectOption[];categories:SelectOption[];labels:SelectOption[];evaluationLabels:SelectOption[];replies:SelectOption[];reviews:Review[]} }>()
const emit=defineEmits<{uploading:[value:boolean];completionType:[action:string]}>()
const {formRef,rules,content,showContent,reasonLimit,validate,clearValidate}=useRepairActionForm(props)
defineExpose({validate,clearValidate})
</script>
