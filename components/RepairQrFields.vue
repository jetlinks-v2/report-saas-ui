<template>
  <a-alert v-if="options.error" :message="options.error" type="error" show-icon />
  <a-form-item label="配置编码" :name="['configuration','code']" :rules="[{required:true,message:'请填写配置编码'},{pattern:/^[A-Za-z0-9_-]{1,60}$/,message:'编码仅支持1-60位字母、数字、下划线和短横线'}]"><a-input v-model:value="form.configuration.code" :disabled="!!form.id" :maxlength="60" placeholder="英文字母、数字、下划线或短横线" /></a-form-item>
  <a-form-item label="报事渠道" :name="['configuration','channelId']" :rules="[{required:true,message:'请选择报事渠道'}]"><a-select v-model:value="form.configuration.channelId" :options="options.channels" placeholder="选择本项目渠道" /></a-form-item>
  <a-form-item label="顶部标语" :name="['configuration','welcomeText']" :rules="[{required:true,whitespace:true,message:'请填写顶部标语'}]"><a-textarea v-model:value="form.configuration.welcomeText" :maxlength="800" :rows="2" /></a-form-item>
  <a-form-item label="可用分类" :name="['configuration','categoryIds']" :rules="[{required:true,type:'array',min:1,message:'请选择可用分类'}]" help="选择上级分类时包含其下已启用的分类。"><a-select v-model:value="form.configuration.categoryIds" mode="multiple" :options="options.categories" /></a-form-item>
  <a-form-item label="允许的空间" :name="['configuration','spaceRootIds']" :rules="[{required:true,type:'array',min:1,message:'请选择允许的空间'}]" help="仅开放所选空间及其下级。"><a-tree-select v-model:value="form.configuration.spaceRootIds" :tree-data="options.spaces" :loading="options.loading" tree-checkable show-checked-strategy="SHOW_PARENT" :field-names="{label:'label',value:'value',children:'children'}" /></a-form-item>
  <a-form-item label="公共区域空间" help="所选空间及其下级按公区报事；必须在允许的空间范围内。"><a-tree-select v-model:value="form.configuration.publicAreaRootIds" :tree-data="options.spaces" tree-checkable show-checked-strategy="SHOW_PARENT" :field-names="{label:'label',value:'value',children:'children'}" /></a-form-item>
  <a-form-item label="启用房间号" help="关闭后只允许选择配置的空间根节点（楼栋），不选择下级房间。"><a-switch v-model:checked="form.configuration.enableRoom" /></a-form-item>
  <a-form-item label="细分区域"><a-switch v-model:checked="form.configuration.enableCampus" /></a-form-item>
  <template v-if="form.configuration.enableCampus">
    <a-card v-for="(area,index) in form.configuration.campusOptions" :key="index" size="small" :title="`区域 ${index+1}`" style="margin-bottom:12px">
      <template #extra><a-button type="link" danger @click="form.configuration.campusOptions?.splice(index,1)">删除</a-button></template>
      <a-form-item label="区域名称" :name="['configuration','campusOptions',index,'name']" :rules="[{required:true,whitespace:true,message:'请填写区域名称'}]"><a-input v-model:value="area.name" :maxlength="64" /></a-form-item>
      <a-form-item label="区域空间" :name="['configuration','campusOptions',index,'spaceRootIds']" :rules="[{required:true,type:'array',min:1,message:'请选择区域空间'}]"><a-tree-select v-model:value="area.spaceRootIds" :tree-data="options.spaces" tree-checkable show-checked-strategy="SHOW_PARENT" :field-names="{label:'label',value:'value',children:'children'}" /></a-form-item>
    </a-card>
    <a-button @click="form.configuration.campusOptions?.push({name:'',spaceRootIds:[]})">新增区域</a-button>
  </template>
  <a-form-item label="备注"><a-textarea v-model:value="form.configuration.remark" :maxlength="800" :rows="2" /></a-form-item>
</template>
<script setup lang="ts">
import type { Configuration } from '../types'
import type { useQrConfiguration } from '../hooks/useQrConfiguration'
defineProps<{form:Configuration;options:ReturnType<typeof useQrConfiguration>['options']['value']}>()
</script>
