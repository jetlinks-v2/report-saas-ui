<template>
  <a-form-item v-if="['label','description'].includes(kind)||kind==='category'&&(form.id||form.parentId)" :label="kind==='description'?'报事标签':kind==='label'?'报事分类':'父类别'" name="parentId" :rules="[{required:kind!=='category',message:'请选择所属分类或标签'}]"><a-select v-if="kind==='description'" v-model:value="form.parentId" :options="options.parents" allow-clear show-search option-filter-prop="label" /><a-tree-select v-else v-model:value="form.parentId" :tree-data="options.parentTree" :field-names="{label:'label',value:'value',children:'children'}" allow-clear show-search tree-node-filter-prop="label" tree-default-expand-all /></a-form-item>
  <a-form-item v-if="['category','description'].includes(kind)" label="显示排序" name="sortIndex" :rules="[{required:true,type:'integer',min:0,message:'请输入非负排序'}]"><a-input-number v-model:value="form.sortIndex" :min="0" /></a-form-item>
  <template v-if="kind==='category'&&options.leafCategory">
    <a-form-item label="关联物联网设备"><a-switch v-model:checked="form.configuration.deviceEnabled" /></a-form-item>
  </template>

  <a-form-item v-if="kind==='satisfaction'" label="分值" :name="['configuration','score']" :rules="[{required:true,type:'integer',message:'请输入整数分值'}]"><a-input-number v-model:value="form.configuration.score" :precision="0" /></a-form-item>
  <a-form-item v-if="kind==='evaluationLabel'" label="级别" :name="['configuration','satisfactionId']" :rules="[{required:true,message:'请选择满意度级别'}]"><a-select v-model:value="form.configuration.satisfactionId" :options="options.satisfactions" placeholder="请选择满意度级别" /></a-form-item>
  <a-form-item v-if="kind==='reply'" label="报事处理节点" :name="['configuration','staticNode']" :rules="[{required:true,message:'请选择报事处理节点'}]"><a-select v-model:value="form.configuration.staticNode" :options="replyNodes" /></a-form-item>
  <a-form-item v-if="['reply','description'].includes(kind)" :label="kind==='reply'?'回复语内容':'报事描述'" :name="['configuration','content']" :rules="[{required:true,whitespace:true,message:'请填写内容'}]"><a-textarea v-model:value="form.configuration.content" :maxlength="kind==='reply'?50:800" :rows="4" show-count /></a-form-item>
  <template v-if="kind==='commission'">
    <template v-for="group in commissionGroups" :key="group.key">
      <a-divider>{{group.label}}</a-divider>
      <template v-if="form.configuration[group.key]">
        <a-form-item v-for="item in commissionRecipients" :key="item.key" :label="item.label+'抽佣比例（%）'" :name="['configuration',group.key,item.key]" :rules="[{required:true,type:'number',min:0,max:100,message:'请输入0-100的抽佣比例'},{validator:()=>validateCommissionTotal(form.configuration,group.key)}]">
          <a-input-number v-model:value="form.configuration[group.key]![item.key]" :min="0" :max="100" :precision="2" />
        </a-form-item>
      </template>
    </template>
  </template>
</template>
<script setup lang="ts">
import type { CategoryOption, Configuration, SelectOption } from '../types'
import { commissionGroups, commissionRecipients, validateCommissionTotal } from '../services/configuration'
defineProps<{ form: Configuration; kind:string; options:{leafCategory:boolean;parentTree:CategoryOption[];parents:SelectOption[];roles:SelectOption[];satisfactions:SelectOption[]} }>()
const replyNodes=[{value:5,label:'跟进'},{value:1,label:'正常完成'},{value:7,label:'非正常完成'}]
</script>
