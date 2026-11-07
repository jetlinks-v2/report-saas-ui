<template>
  <a-spin :spinning="loading">
    <a-empty v-if="!loading&&!value.length" :description="$t('ReportRepair.noAttachments')" :image="null" />
    <a-image-preview-group>
      <div class="attachment-gallery">
        <div v-for="file in files" :key="file.id" class="attachment-item">
          <a-image v-if="file.image" :src="file.url" :alt="file.name" :width="128" :height="104" style="object-fit:cover" @error="imageFailed(file.id)" />
          <a :href="file.url" :download="file.name" target="_blank" rel="noopener noreferrer" class="attachment-name" :title="file.name">{{file.name}}</a>
          <a-button v-if="file.failed" type="link" size="small" @click="load">{{$t('ReportRepair.retryAttachment')}}</a-button>
        </div>
      </div>
    </a-image-preview-group>
  </a-spin>
</template>
<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAttachmentPreviews } from '../hooks/useAttachmentPreviews'
const props=defineProps<{value:string[]}>()
const {t:$t}=useI18n()
const {files,loading,load,imageFailed}=useAttachmentPreviews(toRef(props,'value'))
</script>
<style scoped>
.attachment-gallery{display:flex;flex-wrap:wrap;gap:12px;min-height:24px}
.attachment-item{display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:160px}
.attachment-name{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>
