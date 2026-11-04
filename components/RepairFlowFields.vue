<template>
    <a-form-item label="完成时限(天)" :name="['configuration','finishTimeLimitDays']" :rules="[{required:true,type:'number',min:0,message:'请输入非负完成时限'}]"><a-input-number v-model:value="form.configuration.finishTimeLimitDays" :min="0" :precision="0" /></a-form-item>
    <a-form-item label="转派次数" :name="['configuration','transferLimit']" :rules="[{required:true,type:'number',min:0,message:'请输入非负转派次数'}]"><a-input-number v-model:value="form.configuration.transferLimit" :min="0" :precision="0" /></a-form-item>
    <a-form-item label="延期次数" :name="['configuration','delayLimit']" :rules="[{required:true,type:'number',min:0,message:'请输入非负延期次数'}]"><a-input-number v-model:value="form.configuration.delayLimit" :min="0" :precision="0" /></a-form-item>
    <a-form-item v-for="item in flowRoles" :key="item.key" :label="item.label" :name="['configuration',item.key]" :rules="[{required:item.required,message:'请选择'+item.label}]"><a-select v-model:value="form.configuration[item.key]" :options="roles" :disabled="item.key==='followRoleId'&&form.configuration.autoDispatchEnable" show-search option-filter-prop="label" allow-clear /></a-form-item>
    <a-form-item label="是否需要回访"><a-switch v-model:checked="form.configuration.callbackRequired" /></a-form-item>
    <a-form-item v-if="form.configuration.callbackRequired" label="回访角色" :name="['configuration','callbackRoleId']" :rules="[{required:true,message:'请选择回访角色'}]"><a-select v-model:value="form.configuration.callbackRoleId" :options="roles" allow-clear /></a-form-item>
    <a-form-item label="超时自动分派"><a-switch v-model:checked="form.configuration.autoDispatchEnable" :disabled="!!form.configuration.followRoleId" /></a-form-item>
    <template v-if="form.configuration.autoDispatchEnable"><a-form-item label="分派时长(分钟)" :name="['configuration','autoDispatchMinutes']" :rules="[{required:true,type:'number',min:1,message:'请输入至少1分钟的分派时长'}]"><a-input-number v-model:value="form.configuration.autoDispatchMinutes" :min="1" /></a-form-item><a-form-item label="分派角色" :name="['configuration','autoDispatchRoleId']" :rules="[{required:true,message:'请选择分派角色'}]"><a-select v-model:value="form.configuration.autoDispatchRoleId" :options="roles" /></a-form-item></template>
    <a-form-item label="备注"><a-textarea v-model:value="form.configuration.remark" :maxlength="200" /></a-form-item>
</template>
<script setup lang="ts">
import type { Configuration, SelectOption } from '../types'
defineProps<{form:Configuration;roles:SelectOption[]}>()
const flowRoles = [
  {key:'closeRoleId',label:'非关审核角色',required:true}, {key:'delayRoleId',label:'延期审核角色',required:true},
  {key:'followRoleId',label:'跟进处理角色',required:false}, {key:'levelChangeRoleId',label:'指定等级变更审核角色',required:true},
  {key:'abandonRoleId',label:'废弃审核角色',required:false}
] as const
</script>
