<template>
  <a-form :model="model" :rules="rules" layout="horizontal" :label-col="{span:7}" :wrapper-col="{span:17}" @finish="emit('submit')">
    <a-card :title="$t('ReportRepair.reportAnIssue')">
      <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
      <a-spin :spinning="options.loading">
        <a-row :gutter="24">
          <a-col :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.issueSource')" name="reportSource"><a-radio-group v-model:value="model.reportSource"><a-radio :value="1">{{$t('ReportRepair.propertyInspection')}}</a-radio><a-radio :value="2">{{$t('ReportRepair.ownerReport')}}</a-radio></a-radio-group></a-form-item></a-col>
          <a-col v-if="options.flags.showReportPosition" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.issueLocation')" name="positionType"><a-radio-group v-model:value="model.positionType"><a-radio :value="1">{{$t('ReportRepair.commonArea')}}</a-radio><a-radio :value="2">{{$t('ReportRepair.indoors')}}</a-radio></a-radio-group></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.reportingProject')" name="businessProjectId"><a-select v-model:value="model.businessProjectId" :options="options.projects" show-search option-filter-prop="label" :placeholder="$t('ReportRepair.searchByProjectName')" allow-clear /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.reportingChannel')" name="channelId"><a-select v-model:value="model.channelId" :options="options.channels" disabled :placeholder="$t('ReportRepair.configureAStaffReportingChannelFirst')" /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.issueCategory')" name="categoryId"><a-cascader :value="options.path" :options="options.categories" :placeholder="$t('ReportRepair.selectAThirdLevelIssueCategory')" @change="emit('category', $event as string[])" /></a-form-item></a-col>
          <a-col v-if="model.positionType===2" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.roomNumber')"><a-tree-select v-model:value="model.spaceId" :tree-data="options.spaces" :field-names="{label:'label',value:'value',children:'children'}" show-search tree-node-filter-prop="label" :placeholder="$t('ReportRepair.selectARoom')" allow-clear /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportDetailLocation" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.detailedIssueLocation')"><a-input v-model:value="model.location" :maxlength="512" /></a-form-item></a-col>
          <a-col v-if="options.deviceEnabled" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.deviceInformation')" :help="options.deviceError" :validate-status="options.deviceError?'error':undefined"><a-select v-model:value="model.deviceId" :options="options.devices" :loading="options.deviceLoading" show-search :filter-option="false" :placeholder="$t('ReportRepair.searchByDeviceNameOrID')" allow-clear @search="emit('deviceSearch',$event)" /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportLabel" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.issueTags')" name="labelIds"><a-select v-model:value="model.labelIds" :options="options.labels" mode="multiple" :placeholder="$t('ReportRepair.selectIssueTags')" /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportDescriptionChoice" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.issueDescriptionSelection')"><RepairDescriptionPicker v-model:value="model.descriptionChoiceIds" :options="options.descriptions" /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportUrgency" :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.urgency')"><a-select v-model:value="model.urgency" :options="urgencies" :placeholder="$t('ReportRepair.selectUrgency')" allow-clear /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.reportedBy')" name="contactName"><a-input v-model:value="model.contactName" :placeholder="$t('ReportRepair.enterTheReporterName')" :maxlength="64" /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item :label="$t('ReportRepair.contactInformation')" name="contactPhone"><a-input v-model:value="model.contactPhone" :placeholder="$t('ReportRepair.enterContactInformation')" :maxlength="64" /></a-form-item></a-col>
          <a-col v-if="options.flags.showProblemDescription" :span="24"><a-form-item :label="$t('ReportRepair.issueDescription')" name="description" :label-col="{span:2}" :wrapper-col="{span:22}"><a-textarea :value="model.description" :rows="5" :maxlength="800" show-count :placeholder="$t('ReportRepair.enterAnIssueDescription')" @update:value="emit('description', $event)" /></a-form-item></a-col>
        </a-row>
      </a-spin>
    </a-card>
    <a-card v-if="options.flags.showMediaUpload" :title="$t('ReportRepair.attachments')" style="margin-top:12px"><RepairAttachments v-model:value="model.attachmentIds" @busy="emit('uploading', $event)" /></a-card>
    <a-space class="form-footer"><a-button type="primary" html-type="submit" :loading="saving" :disabled="options.loading||options.uploading">{{$t('ReportRepair.save')}}</a-button><a-button @click="emit('cancel')">{{$t('ReportRepair.cancel')}}</a-button></a-space>
  </a-form>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { CategoryOption, OrderInput, SelectOption, RepairFormOptions } from '../types'
import RepairAttachments from './RepairAttachments.vue'
import RepairDescriptionPicker from './RepairDescriptionPicker.vue'
const { t: $t } = useI18n()
const props=defineProps<{ model: OrderInput; options: { flags:RepairFormOptions; deviceEnabled:boolean;devices:SelectOption[];deviceLoading:boolean;deviceError:string; projects: SelectOption[]; categories: CategoryOption[]; channels: SelectOption[]; labels: SelectOption[]; descriptions: SelectOption[]; spaces: CategoryOption[]; path: string[]; loading: boolean; uploading: boolean }; saving: boolean; error: string }>()
const emit = defineEmits<{ deviceSearch:[text:string]; submit: []; cancel: []; category: [path: string[]]; description: [text: string]; uploading: [busy: boolean] }>()
const urgencies = [{value:1,label:$t('ReportRepair.urgencyNormal')},{value:2,label:$t('ReportRepair.urgent')},{value:3,label:$t('ReportRepair.veryUrgent')}]
const required = [{required:true,message:$t('ReportRepair.thisFieldIsRequired')}]
const rules = computed(() => ({ reportSource: required, positionType: required, businessProjectId: required, channelId: required,
  categoryId: required, labelIds: [{required:props.options.flags.showReportLabel,type:'array' as const,min:1,message:$t('ReportRepair.selectIssueTags')}],
  contactName: [{required:true,message:$t('ReportRepair.enterTheReporterName')},{pattern:/^\S+$/,message:$t('ReportRepair.theReporterNameMustNotContainWhitespace')}],
  contactPhone: [{required:true,message:$t('ReportRepair.enterContactInformation')},{pattern:/^1[3-9]\d{9}$|^(0\d{2,3}-?)?\d{7,8}$/,message:$t('ReportRepair.enterAValidMobileOrLandlineNumber')}], description: required }))
</script>
<style scoped>
.form-footer{display:flex;justify-content:center;padding:20px}.description-options{display:flex;flex-direction:column;gap:16px;max-height:420px;overflow:auto}
</style>
