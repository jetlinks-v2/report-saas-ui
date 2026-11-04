<template>
    <a-form-item :label="$t('ReportRepair.completionDeadlineDays')" :name="['configuration','finishTimeLimitDays']" :rules="[{required:true,type:'number',min:0,message:$t('ReportRepair.enterANonNegativeCompletionDeadline')}]"><a-input-number v-model:value="form.configuration.finishTimeLimitDays" :min="0" :precision="0" /></a-form-item>
    <a-form-item :label="$t('ReportRepair.transferLimit')" :name="['configuration','transferLimit']" :rules="[{required:true,type:'number',min:0,message:$t('ReportRepair.enterANonNegativeTransferLimit')}]"><a-input-number v-model:value="form.configuration.transferLimit" :min="0" :precision="0" /></a-form-item>
    <a-form-item :label="$t('ReportRepair.extensionLimit')" :name="['configuration','delayLimit']" :rules="[{required:true,type:'number',min:0,message:$t('ReportRepair.enterANonNegativeExtensionLimit')}]"><a-input-number v-model:value="form.configuration.delayLimit" :min="0" :precision="0" /></a-form-item>
    <a-form-item v-for="item in flowRoles" :key="item.key" :label="item.label" :name="['configuration',item.key]" :rules="[{required:item.required,message:$t('ReportRepair.select')+item.label}]"><a-select v-model:value="form.configuration[item.key]" :options="roles" :disabled="item.key==='followRoleId'&&form.configuration.autoDispatchEnable" show-search option-filter-prop="label" allow-clear /></a-form-item>
    <a-form-item :label="$t('ReportRepair.requireAFollowUpVisit')"><a-switch v-model:checked="form.configuration.callbackRequired" /></a-form-item>
    <a-form-item v-if="form.configuration.callbackRequired" :label="$t('ReportRepair.followUpVisitRole')" :name="['configuration','callbackRoleId']" :rules="[{required:true,message:$t('ReportRepair.selectAFollowUpVisitRole')}]"><a-select v-model:value="form.configuration.callbackRoleId" :options="roles" allow-clear /></a-form-item>
    <a-form-item :label="$t('ReportRepair.assignAutomaticallyAfterTimeout')"><a-switch v-model:checked="form.configuration.autoDispatchEnable" :disabled="!!form.configuration.followRoleId" /></a-form-item>
    <template v-if="form.configuration.autoDispatchEnable"><a-form-item :label="$t('ReportRepair.assignmentDelayMinutes')" :name="['configuration','autoDispatchMinutes']" :rules="[{required:true,type:'number',min:1,message:$t('ReportRepair.enterAnAssignmentDelayOfAtLeast1Minute')}]"><a-input-number v-model:value="form.configuration.autoDispatchMinutes" :min="1" /></a-form-item><a-form-item :label="$t('ReportRepair.assignmentRole')" :name="['configuration','autoDispatchRoleId']" :rules="[{required:true,message:$t('ReportRepair.selectAnAssignmentRole')}]"><a-select v-model:value="form.configuration.autoDispatchRoleId" :options="roles" /></a-form-item></template>
    <a-form-item :label="$t('ReportRepair.remark')"><a-textarea v-model:value="form.configuration.remark" :maxlength="200" /></a-form-item>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Configuration, SelectOption } from '../types'
const { t: $t } = useI18n()
defineProps<{form:Configuration;roles:SelectOption[]}>()
const flowRoles = [
  {key:'closeRoleId',label:$t('ReportRepair.abnormalClosureReviewerRole'),required:true}, {key:'delayRoleId',label:$t('ReportRepair.extensionReviewerRole'),required:true},
  {key:'followRoleId',label:$t('ReportRepair.handlingRole'),required:false}, {key:'levelChangeRoleId',label:$t('ReportRepair.specifiedPriorityChangeReviewerRole'),required:true},
  {key:'abandonRoleId',label:$t('ReportRepair.discardReviewerRole'),required:false}
] as const
</script>
