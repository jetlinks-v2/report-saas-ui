<template>
  <main class="repair-public-form">
    <a-spin :spinning="loading">
      <a-card :title="definition?.projectName || $t('ReportRepair.issuesAndRepairs')">
        <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
        <a-result v-if="number" status="success" :title="$t('ReportRepair.issueSubmitted')" :sub-title="$t('ReportRepair.issueNumberMessage', { p0: number })"><template #extra><a-button @click="load">{{$t('ReportRepair.reportAnotherIssue')}}</a-button></template></a-result>
        <template v-else-if="definition">
          <p class="welcome">{{definition.welcomeText}}</p>
          <a-empty v-if="!categories.length || !spaces.length" :description="$t('ReportRepair.noAvailableIssueCategoriesOrLocationsContactTheProperty')" />
          <a-form v-else :model="form" layout="vertical" @finish="submit">
            <a-form-item :label="$t('ReportRepair.issueCategory')" required><a-select v-model:value="form.categoryId" :options="categories" :placeholder="$t('ReportRepair.selectAnIssueCategory')" /></a-form-item>
            <a-form-item v-if="definition.enableCampus" :label="$t('ReportRepair.area')" required><a-select v-model:value="area" :options="definition.campusOptions.map((row,index)=>({value:index,label:row.name}))" /></a-form-item>
            <a-form-item :label="$t('ReportRepair.buildingRoomOrCommonSpace')" required><a-tree-select v-model:value="form.spaceId" :tree-data="spaces" tree-default-expand-all :field-names="{label:'label',value:'value',children:'children'}" :placeholder="$t('ReportRepair.selectABuildingOrRoom')" /></a-form-item>
            <a-form-item v-if="formFlags.showReportPosition&&position" :label="$t('ReportRepair.issueLocation')"><a-tag>{{position===1?$t('ReportRepair.commonArea'):$t('ReportRepair.indoors')}}</a-tag></a-form-item>
            <a-form-item v-if="formFlags.showReportDetailLocation" :label="$t('ReportRepair.detailedLocation')"><a-input v-model:value="form.location" :maxlength="512" :placeholder="$t('ReportRepair.enterASpecificLocation')" /></a-form-item>
            <a-form-item v-if="formFlags.showReportLabel" :label="$t('ReportRepair.issueTags')" required><a-select v-model:value="form.labelIds" :options="labels" mode="multiple" :placeholder="$t('ReportRepair.selectTags')" /></a-form-item>
            <a-form-item v-if="formFlags.showReportDescriptionChoice&&descriptions.length" :label="$t('ReportRepair.commonIssueDescriptions')"><a-select v-model:value="form.descriptionChoiceIds" :options="descriptions" mode="multiple" /><a-button v-if="formFlags.showProblemDescription" type="link" @click="appendDescriptions">{{$t('ReportRepair.addToIssueDescription')}}</a-button></a-form-item>
            <a-form-item v-if="formFlags.showReportUrgency" :label="$t('ReportRepair.urgency')"><a-select v-model:value="form.urgency" :options="[{value:1,label:$t('ReportRepair.urgencyNormal')},{value:2,label:$t('ReportRepair.urgent')},{value:3,label:$t('ReportRepair.veryUrgent')}]" allow-clear /></a-form-item>
            <a-form-item v-if="formFlags.showProblemDescription" :label="$t('ReportRepair.issueDescription')" required><a-textarea v-model:value="form.description" :maxlength="800" show-count :rows="4" /></a-form-item>
            <a-form-item :label="$t('ReportRepair.reportedBy')" required><a-input v-model:value="form.contactName" :maxlength="64" /></a-form-item>
            <a-form-item :label="$t('ReportRepair.phone')" required><a-input v-model:value="form.contactPhone" :maxlength="64" type="tel" /></a-form-item>
            <a-form-item v-if="formFlags.showMediaUpload" :label="$t('ReportRepair.attachments')"><a-upload :file-list="files" :before-upload="upload" :remove="remove" :multiple="true" :max-count="20" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"><a-button>{{$t('ReportRepair.uploadAttachments')}}</a-button></a-upload></a-form-item>
            <a-button type="primary" html-type="submit" block :loading="saving">{{$t('ReportRepair.submitIssue')}}</a-button>
          </a-form>
        </template>
        <a-button v-else-if="!loading" @click="load">{{$t('ReportRepair.reload')}}</a-button>
      </a-card>
    </a-spin>
  </main>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePublicRepair } from '../../../hooks/usePublicRepair'
const { t: $t } = useI18n()
const {formFlags,position,definition,loading,saving,error,number,form,area,files,categories,labels,descriptions,spaces,load,upload,remove,submit,appendDescriptions}=usePublicRepair()
</script>
<style scoped>
.repair-public-form{width:min(100%,680px);margin:24px auto;padding:0 16px 32px;box-sizing:border-box}
.welcome{white-space:pre-wrap;color:var(--ant-color-text-secondary,#666);margin-bottom:24px}
@media(max-width:640px){.repair-public-form{margin:12px auto;padding:0 8px 24px}}
</style>
