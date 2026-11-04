<template>
  <a-form :model="model" :rules="rules" layout="horizontal" :label-col="{span:7}" :wrapper-col="{span:17}" @finish="emit('submit')">
    <a-card title="发起报事">
      <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
      <a-spin :spinning="options.loading">
        <a-row :gutter="24">
          <a-col :lg="8" :xs="24"><a-form-item label="报事来源" name="reportSource"><a-radio-group v-model:value="model.reportSource"><a-radio :value="1">物业自查</a-radio><a-radio :value="2">业主报事</a-radio></a-radio-group></a-form-item></a-col>
          <a-col v-if="options.flags.showReportPosition" :lg="8" :xs="24"><a-form-item label="报事位置" name="positionType"><a-radio-group v-model:value="model.positionType"><a-radio :value="1">公区</a-radio><a-radio :value="2">室内</a-radio></a-radio-group></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item label="报事项目" name="businessProjectId"><a-select v-model:value="model.businessProjectId" :options="options.projects" show-search option-filter-prop="label" placeholder="请输入项目名称搜索" allow-clear /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item label="报事渠道" name="channelId"><a-select v-model:value="model.channelId" :options="options.channels" disabled placeholder="请先配置后台报事渠道" /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item label="报事分类" name="categoryId"><a-cascader :value="options.path" :options="options.categories" placeholder="请选择第三级报事分类" @change="emit('category', $event as string[])" /></a-form-item></a-col>
          <a-col v-if="model.positionType===2" :lg="8" :xs="24"><a-form-item label="房间号"><a-tree-select v-model:value="model.spaceId" :tree-data="options.spaces" :field-names="{label:'label',value:'value',children:'children'}" show-search tree-node-filter-prop="label" placeholder="请选择房间" allow-clear /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportDetailLocation" :lg="8" :xs="24"><a-form-item label="报事详细位置"><a-input v-model:value="model.location" :maxlength="512" /></a-form-item></a-col>
          <a-col v-if="options.deviceEnabled" :lg="8" :xs="24"><a-form-item label="设备信息" :help="options.deviceError" :validate-status="options.deviceError?'error':undefined"><a-select v-model:value="model.deviceId" :options="options.devices" :loading="options.deviceLoading" show-search :filter-option="false" placeholder="输入设备名称或编号搜索" allow-clear @search="emit('deviceSearch',$event)" /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportLabel" :lg="8" :xs="24"><a-form-item label="报事标签" name="labelIds"><a-select v-model:value="model.labelIds" :options="options.labels" mode="multiple" placeholder="请选择报事标签" /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportDescriptionChoice" :lg="8" :xs="24"><a-form-item label="报事描述选择"><RepairDescriptionPicker v-model:value="model.descriptionChoiceIds" :options="options.descriptions" /></a-form-item></a-col>
          <a-col v-if="options.flags.showReportUrgency" :lg="8" :xs="24"><a-form-item label="紧急程度"><a-select v-model:value="model.urgency" :options="urgencies" placeholder="请选择紧急程度" allow-clear /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item label="报事人" name="contactName"><a-input v-model:value="model.contactName" placeholder="请输入报事人" :maxlength="64" /></a-form-item></a-col>
          <a-col :lg="8" :xs="24"><a-form-item label="联系方式" name="contactPhone"><a-input v-model:value="model.contactPhone" placeholder="请输入联系方式" :maxlength="64" /></a-form-item></a-col>
          <a-col v-if="options.flags.showProblemDescription" :span="24"><a-form-item label="报事描述" name="description" :label-col="{span:2}" :wrapper-col="{span:22}"><a-textarea :value="model.description" :rows="5" :maxlength="800" show-count placeholder="请输入报事描述" @update:value="emit('description', $event)" /></a-form-item></a-col>
        </a-row>
      </a-spin>
    </a-card>
    <a-card v-if="options.flags.showMediaUpload" title="附件" style="margin-top:12px"><RepairAttachments v-model:value="model.attachmentIds" @busy="emit('uploading', $event)" /></a-card>
    <a-space class="form-footer"><a-button type="primary" html-type="submit" :loading="saving" :disabled="options.loading||options.uploading">保存</a-button><a-button @click="emit('cancel')">取消</a-button></a-space>
  </a-form>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryOption, OrderInput, SelectOption, RepairFormOptions } from '../types'
import RepairAttachments from './RepairAttachments.vue'
import RepairDescriptionPicker from './RepairDescriptionPicker.vue'
const props=defineProps<{ model: OrderInput; options: { flags:RepairFormOptions; deviceEnabled:boolean;devices:SelectOption[];deviceLoading:boolean;deviceError:string; projects: SelectOption[]; categories: CategoryOption[]; channels: SelectOption[]; labels: SelectOption[]; descriptions: SelectOption[]; spaces: CategoryOption[]; path: string[]; loading: boolean; uploading: boolean }; saving: boolean; error: string }>()
const emit = defineEmits<{ deviceSearch:[text:string]; submit: []; cancel: []; category: [path: string[]]; description: [text: string]; uploading: [busy: boolean] }>()
const urgencies = [{value:1,label:'一般'},{value:2,label:'紧急'},{value:3,label:'非常紧急'}]
const required = [{required:true,message:'请填写此项'}]
const rules = computed(() => ({ reportSource: required, positionType: required, businessProjectId: required, channelId: required,
  categoryId: required, labelIds: [{required:props.options.flags.showReportLabel,type:'array' as const,min:1,message:'请选择报事标签'}],
  contactName: [{required:true,message:'请输入报事人'},{pattern:/^\S+$/,message:'报事人中间不能有空白'}],
  contactPhone: [{required:true,message:'请输入联系方式'},{pattern:/^1[3-9]\d{9}$|^(0\d{2,3}-?)?\d{7,8}$/,message:'请输入正确的电话号码或座机号'}], description: required }))
</script>
<style scoped>
.form-footer{display:flex;justify-content:center;padding:20px}.description-options{display:flex;flex-direction:column;gap:16px;max-height:420px;overflow:auto}
</style>
