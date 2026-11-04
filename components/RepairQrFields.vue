<template>
  <a-alert v-if="options.error" :message="options.error" type="error" show-icon />
  <a-form-item :label="$t('ReportRepair.configurationCode')" :name="['configuration','code']" :rules="[{required:true,message:$t('ReportRepair.enterAConfigurationCode')},{pattern:/^[A-Za-z0-9_-]{1,60}$/,message:$t('ReportRepair.use160LettersDigitsUnderscoresOrHyphens')}]"><a-input v-model:value="form.configuration.code" :disabled="!!form.id" :maxlength="60" :placeholder="$t('ReportRepair.lettersDigitsUnderscoresOrHyphens')" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.reportingChannel')" :name="['configuration','channelId']" :rules="[{required:true,message:$t('ReportRepair.selectAReportingChannel')}]"><a-select v-model:value="form.configuration.channelId" :options="options.channels" :placeholder="$t('ReportRepair.selectAChannelInThisProject')" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.welcomeMessage')" :name="['configuration','welcomeText']" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.enterAWelcomeMessage')}]"><a-textarea v-model:value="form.configuration.welcomeText" :maxlength="800" :rows="2" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.availableCategories')" :name="['configuration','categoryIds']" :rules="[{required:true,type:'array',min:1,message:$t('ReportRepair.selectAvailableCategories')}]" :help="$t('ReportRepair.selectingAParentCategoryIncludesItsEnabledDescendants')"><a-select v-model:value="form.configuration.categoryIds" mode="multiple" :options="options.categories" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.allowedSpaces')" :name="['configuration','spaceRootIds']" :rules="[{required:true,type:'array',min:1,message:$t('ReportRepair.selectAllowedSpaces')}]" :help="$t('ReportRepair.onlySelectedSpacesAndTheirDescendantsWillBeAvailable')"><a-tree-select v-model:value="form.configuration.spaceRootIds" :tree-data="options.spaces" :loading="options.loading" tree-checkable show-checked-strategy="SHOW_PARENT" :field-names="{label:'label',value:'value',children:'children'}" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.commonAreaSpaces')" :help="$t('ReportRepair.selectedSpacesAndTheirDescendantsAreTreatedAsCommon')"><a-tree-select v-model:value="form.configuration.publicAreaRootIds" :tree-data="options.spaces" tree-checkable show-checked-strategy="SHOW_PARENT" :field-names="{label:'label',value:'value',children:'children'}" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.enableRoomSelection')" :help="$t('ReportRepair.whenDisabledOnlyConfiguredRootSpacesBuildingsCanBe')"><a-switch v-model:checked="form.configuration.enableRoom" /></a-form-item>
  <a-form-item :label="$t('ReportRepair.subareas')"><a-switch v-model:checked="form.configuration.enableCampus" /></a-form-item>
  <template v-if="form.configuration.enableCampus">
    <a-card v-for="(area,index) in form.configuration.campusOptions" :key="index" size="small" :title="$t('ReportRepair.numberedArea', { p0: index+1 })" style="margin-bottom:12px">
      <template #extra><a-button type="link" danger @click="form.configuration.campusOptions?.splice(index,1)">{{$t('ReportRepair.delete')}}</a-button></template>
      <a-form-item :label="$t('ReportRepair.areaName')" :name="['configuration','campusOptions',index,'name']" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.enterAnAreaName')}]"><a-input v-model:value="area.name" :maxlength="64" /></a-form-item>
      <a-form-item :label="$t('ReportRepair.areaSpaces')" :name="['configuration','campusOptions',index,'spaceRootIds']" :rules="[{required:true,type:'array',min:1,message:$t('ReportRepair.selectAreaSpaces')}]"><a-tree-select v-model:value="area.spaceRootIds" :tree-data="options.spaces" tree-checkable show-checked-strategy="SHOW_PARENT" :field-names="{label:'label',value:'value',children:'children'}" /></a-form-item>
    </a-card>
    <a-button @click="form.configuration.campusOptions?.push({name:'',spaceRootIds:[]})">{{$t('ReportRepair.addArea')}}</a-button>
  </template>
  <a-form-item :label="$t('ReportRepair.remark')"><a-textarea v-model:value="form.configuration.remark" :maxlength="800" :rows="2" /></a-form-item>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Configuration } from '../types'
import type { useQrConfiguration } from '../hooks/useQrConfiguration'
const { t: $t } = useI18n()
defineProps<{form:Configuration;options:ReturnType<typeof useQrConfiguration>['options']['value']}>()
</script>
