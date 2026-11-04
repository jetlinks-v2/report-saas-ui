<template>
  <main class="repair-public-form">
    <a-spin :spinning="loading">
      <a-card :title="definition?.projectName || '报事报修'">
        <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
        <a-result v-if="number" status="success" title="报事已提交" :sub-title="`报事单号：${number}`"><template #extra><a-button @click="load">继续报事</a-button></template></a-result>
        <template v-else-if="definition">
          <p class="welcome">{{definition.welcomeText}}</p>
          <a-empty v-if="!categories.length || !spaces.length" description="暂未开放可用的报事分类或位置，请联系物业工作人员" />
          <a-form v-else :model="form" layout="vertical" @finish="submit">
            <a-form-item label="报事分类" required><a-select v-model:value="form.categoryId" :options="categories" placeholder="请选择报事分类" /></a-form-item>
            <a-form-item v-if="definition.enableCampus" label="区域" required><a-select v-model:value="area" :options="definition.campusOptions.map((row,index)=>({value:index,label:row.name}))" /></a-form-item>
            <a-form-item label="楼栋/房间或公共空间" required><a-tree-select v-model:value="form.spaceId" :tree-data="spaces" tree-default-expand-all :field-names="{label:'label',value:'value',children:'children'}" placeholder="请选择楼栋或房间" /></a-form-item>
            <a-form-item v-if="formFlags.showReportPosition&&position" label="报事位置"><a-tag>{{position===1?'公区':'室内'}}</a-tag></a-form-item>
            <a-form-item v-if="formFlags.showReportDetailLocation" label="详细位置"><a-input v-model:value="form.location" :maxlength="512" placeholder="补充具体位置" /></a-form-item>
            <a-form-item v-if="formFlags.showReportLabel" label="报事标签" required><a-select v-model:value="form.labelIds" :options="labels" mode="multiple" placeholder="请选择标签" /></a-form-item>
            <a-form-item v-if="formFlags.showReportDescriptionChoice&&descriptions.length" label="常见报事描述"><a-select v-model:value="form.descriptionChoiceIds" :options="descriptions" mode="multiple" /><a-button v-if="formFlags.showProblemDescription" type="link" @click="appendDescriptions">添加到报事描述</a-button></a-form-item>
            <a-form-item v-if="formFlags.showReportUrgency" label="紧急程度"><a-select v-model:value="form.urgency" :options="[{value:1,label:'一般'},{value:2,label:'紧急'},{value:3,label:'非常紧急'}]" allow-clear /></a-form-item>
            <a-form-item v-if="formFlags.showProblemDescription" label="报事描述" required><a-textarea v-model:value="form.description" :maxlength="800" show-count :rows="4" /></a-form-item>
            <a-form-item label="报事人" required><a-input v-model:value="form.contactName" :maxlength="64" /></a-form-item>
            <a-form-item label="联系电话" required><a-input v-model:value="form.contactPhone" :maxlength="64" type="tel" /></a-form-item>
            <a-form-item v-if="formFlags.showMediaUpload" label="附件"><a-upload :file-list="files" :before-upload="upload" :remove="remove" :multiple="true" :max-count="20" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"><a-button>上传附件</a-button></a-upload></a-form-item>
            <a-button type="primary" html-type="submit" block :loading="saving">提交报事</a-button>
          </a-form>
        </template>
        <a-button v-else-if="!loading" @click="load">重新加载</a-button>
      </a-card>
    </a-spin>
  </main>
</template>
<script setup lang="ts">
import { usePublicRepair } from '../../../hooks/usePublicRepair'
const {formFlags,position,definition,loading,saving,error,number,form,area,files,categories,labels,descriptions,spaces,load,upload,remove,submit,appendDescriptions}=usePublicRepair()
</script>
<style scoped>
.repair-public-form{width:min(100%,680px);margin:24px auto;padding:0 16px 32px;box-sizing:border-box}
.welcome{white-space:pre-wrap;color:var(--ant-color-text-secondary,#666);margin-bottom:24px}
@media(max-width:640px){.repair-public-form{margin:12px auto;padding:0 8px 24px}}
</style>
