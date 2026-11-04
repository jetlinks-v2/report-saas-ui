<template>
  <a-form-item v-if="['label','description'].includes(kind)||kind==='category'&&(form.id||form.parentId)" :label="kind==='description'?$t('ReportRepair.issueTags'):kind==='label'?$t('ReportRepair.issueCategory'):$t('ReportRepair.parentCategory')" name="parentId" :rules="[{required:kind!=='category',message:$t('ReportRepair.selectAParentCategoryOrTag')}]"><a-select v-if="kind==='description'" v-model:value="form.parentId" :options="options.parents" allow-clear show-search option-filter-prop="label" /><a-tree-select v-else v-model:value="form.parentId" :tree-data="options.parentTree" :field-names="{label:'label',value:'value',children:'children'}" allow-clear show-search tree-node-filter-prop="label" tree-default-expand-all /></a-form-item>
  <a-form-item v-if="['category','description'].includes(kind)" :label="$t('ReportRepair.displayOrder')" name="sortIndex" :rules="[{required:true,type:'integer',min:0,message:$t('ReportRepair.enterANonNegativeSortOrder')}]"><a-input-number v-model:value="form.sortIndex" :min="0" /></a-form-item>
  <template v-if="kind==='category'&&options.leafCategory">
    <a-form-item :label="$t('ReportRepair.linkIoTDevice')"><a-switch v-model:checked="form.configuration.deviceEnabled" /></a-form-item>
  </template>

  <a-form-item v-if="kind==='satisfaction'" :label="$t('ReportRepair.score')" :name="['configuration','score']" :rules="[{required:true,type:'integer',message:$t('ReportRepair.enterAnIntegerScore')}]"><a-input-number v-model:value="form.configuration.score" :precision="0" /></a-form-item>
  <a-form-item v-if="kind==='evaluationLabel'" :label="$t('ReportRepair.rating')" :name="['configuration','satisfactionId']" :rules="[{required:true,message:$t('ReportRepair.selectASatisfactionRating')}]"><a-select v-model:value="form.configuration.satisfactionId" :options="options.satisfactions" :placeholder="$t('ReportRepair.selectASatisfactionRating')" /></a-form-item>
  <a-form-item v-if="kind==='reply'" :label="$t('ReportRepair.processingStep')" :name="['configuration','staticNode']" :rules="[{required:true,message:$t('ReportRepair.selectAProcessingStep')}]"><a-select v-model:value="form.configuration.staticNode" :options="replyNodes" /></a-form-item>
  <a-form-item v-if="['reply','description'].includes(kind)" :label="kind==='reply'?$t('ReportRepair.replyContent'):$t('ReportRepair.issueDescription')" :name="['configuration','content']" :rules="[{required:true,whitespace:true,message:$t('ReportRepair.enterContent')}]"><a-textarea v-model:value="form.configuration.content" :maxlength="kind==='reply'?50:800" :rows="4" show-count /></a-form-item>
  <template v-if="kind==='commission'">
    <template v-for="group in commissionGroups" :key="group.key">
      <a-divider>{{group.label}}</a-divider>
      <template v-if="form.configuration[group.key]">
        <a-form-item v-for="item in commissionRecipients" :key="item.key" :label="item.label+$t('ReportRepair.commissionPercentage')" :name="['configuration',group.key,item.key]" :rules="[{required:true,type:'number',min:0,max:100,message:$t('ReportRepair.enterACommissionRateFrom0To100')},{validator:()=>validateCommissionTotal(form.configuration,group.key)}]">
          <a-input-number v-model:value="form.configuration[group.key]![item.key]" :min="0" :max="100" :precision="2" />
        </a-form-item>
      </template>
    </template>
  </template>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CategoryOption, Configuration, SelectOption } from '../types'
import { commissionGroups, commissionRecipients, validateCommissionTotal } from '../services/configuration'
const { t: $t } = useI18n()
defineProps<{ form: Configuration; kind:string; options:{leafCategory:boolean;parentTree:CategoryOption[];parents:SelectOption[];roles:SelectOption[];satisfactions:SelectOption[]} }>()
const replyNodes=[{value:5,label:$t('ReportRepair.followUp')},{value:1,label:$t('ReportRepair.normalCompletion')},{value:7,label:$t('ReportRepair.abnormalCompletion')}]
</script>
