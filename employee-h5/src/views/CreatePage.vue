<script setup lang="ts">
import {reactive} from 'vue'
import {FileTextOutlined,EditOutlined,ContactsOutlined,SendOutlined} from '@ant-design/icons-vue'
import {useIntake} from '../hooks/useIntake'
import MediaInput from '../components/MediaInput.vue'
import MediaPreview from '../components/MediaPreview.vue'
import OrderSteps from '../components/OrderSteps.vue'
const model=useIntake(),formRef=model.formRef,vm=reactive(model)
</script>
<template><section class="page form-page"><div class="intake-intro"><div><span class="eyebrow">发起报事</span><h2>记录现场，及时处理</h2><p>描述清楚问题，帮助处理人员快速定位</p></div><img src="/images/report/repair-toolkit.svg" alt="" /></div><OrderSteps /><a-alert v-if="vm.error" :message="vm.error" type="error" show-icon /><a-form ref="formRef" :model="vm.input" :rules="vm.rules" layout="horizontal" @finish="vm.submit"><div class="source-tabs"><a-radio-group v-model:value="vm.input.reportSource"><a-radio-button :value="1">物业自查</a-radio-button><a-radio-button :value="2">业主报事</a-radio-button></a-radio-group></div><div class="panel form-card"><h2 class="icon-heading"><FileTextOutlined aria-hidden="true" />报事信息</h2>

 <a-form-item label="业务项目" name="businessProjectId"><a-select v-model:value="vm.input.businessProjectId" :options="vm.projectOptions" placeholder="请选择业务项目" show-search option-filter-prop="label" /></a-form-item>
 <a-spin :spinning="vm.loading"><a-form-item label="报事分类" name="categoryId"><a-cascader v-model:value="vm.path" :options="vm.tree" placeholder="请选择第三级分类" /></a-form-item>
 <a-form-item label="报事渠道" name="channelId"><a-select v-model:value="vm.input.channelId" :options="vm.channels" placeholder="请选择渠道" /></a-form-item>
 <a-form-item v-if="vm.flags.showReportLabel" label="报事标签" name="labelIds"><a-select v-model:value="vm.input.labelIds" mode="multiple" :options="vm.labels" placeholder="请选择标签" /></a-form-item>
 <a-form-item v-if="vm.flags.showReportDescriptionChoice" label="描述选择"><a-select v-model:value="vm.input.descriptionChoiceIds" mode="multiple" :options="vm.descriptions" placeholder="选择常用描述" /></a-form-item>
 <a-form-item v-if="vm.flags.showReportPosition" label="报事位置"><a-radio-group v-model:value="vm.input.positionType"><a-radio :value="1">公区</a-radio><a-radio :value="2">室内</a-radio></a-radio-group></a-form-item>
 <a-form-item v-if="vm.flags.showReportPosition" label="区域 / 楼栋 / 房间"><a-cascader v-model:value="vm.spacePath" allow-clear change-on-select :options="vm.spaceOptions" placeholder="请逐层选择区域、楼栋或房间" /></a-form-item>
 <a-form-item v-if="vm.flags.showReportDetailLocation" label="详细位置"><a-input v-model:value="vm.input.location" :maxlength="500" placeholder="补充具体位置" /></a-form-item>
 <a-form-item v-if="vm.deviceEnabled" label="关联设备"><a-select v-model:value="vm.input.deviceId" :options="vm.devices.map(d=>({value:d.id,label:d.name}))" allow-clear show-search :filter-option="false" :loading="vm.deviceLoading" placeholder="搜索项目设备" @search="vm.searchDevices" /></a-form-item>
 <a-form-item v-if="vm.flags.showReportUrgency" label="紧急程度"><a-select v-model:value="vm.input.urgency" allow-clear :options="[{value:1,label:'一般'},{value:2,label:'紧急'},{value:3,label:'非常紧急'}]" /></a-form-item>
 <h2 class="form-section-title icon-heading"><EditOutlined aria-hidden="true" />问题描述</h2><a-form-item v-if="vm.flags.showProblemDescription" label="问题描述"><a-textarea v-model:value="vm.manual" :rows="4" :maxlength="800" show-count placeholder="请描述现场问题" /></a-form-item>
 <div v-if="vm.input.descriptionChoiceIds.length" class="description-preview">{{vm.description}}</div>
 <h2 class="form-section-title icon-heading"><ContactsOutlined aria-hidden="true" />联系信息</h2><a-form-item label="报事人" name="contactName"><a-input v-model:value="vm.input.contactName" :maxlength="64" placeholder="填写报事人姓名" /></a-form-item>
 <a-form-item label="联系电话" name="contactPhone"><a-input v-model:value="vm.input.contactPhone" type="tel" :maxlength="32" /></a-form-item>
 <a-form-item v-if="vm.flags.showMediaUpload" label="图片 / 视频 / 附件" class="stacked-field"><MediaInput :ids="vm.input.attachmentIds" :names="vm.names" :loading="vm.uploading" @files="vm.uploadFiles" @remove="vm.input.attachmentIds=vm.input.attachmentIds.filter(id=>id!==$event)" @preview="vm.openPreview" /></a-form-item>
 </a-spin></div><div class="form-submit"><a-button type="primary" html-type="submit" block size="large" :loading="vm.saving" :disabled="vm.loading||vm.uploading"><SendOutlined aria-hidden="true" />提交报事</a-button></div></a-form><MediaPreview :preview="vm.preview" @close="vm.closePreview" /></section></template>
