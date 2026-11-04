<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { validateImportFile } from '../../../utils/system-management/archiveImport'
import type { CustomerType } from '../../../api/system-management/archive'
const props = defineProps<{
  open: boolean
  projectName: string
  kind: 'house' | 'customer'
  busy: boolean
}>()
const emit = defineEmits<{ close: []; template: [CustomerType?]; upload: [File, CustomerType?] }>()
const { t } = useI18n()
const file = ref<File>()
const customerType = ref<CustomerType>()
watch(
  () => props.open,
  () => {
    file.value = undefined
    customerType.value = undefined
  }
)
// 模板列随客户类型变化，不能沿用切换前选中的文件。
watch(customerType, () => {
  file.value = undefined
})
function choose(selected: File) {
  const invalid = validateImportFile(selected)
  file.value = undefined
  if (invalid) onlyMessage(t('ReportSystem.Archive.' + (invalid === 'format' ? 'importFormat' : 'importSize')), 'error')
  else file.value = selected
  return false
}
</script>
<template>
  <a-modal
    wrap-class-name="archive-import-modal"
    :open="open"
    :width="640"
    :style="{ maxWidth: 'calc(100vw - 32px)' }"
    :title="t('ReportSystem.Archive.importTitle', { kind: t('ReportSystem.Archive.' + (kind === 'house' ? 'houses' : 'customers')) })"
    :closable="!busy"
    :mask-closable="!busy"
    :keyboard="!busy"
    @cancel="emit('close')"
  >
    <div class="archive-import">
      <div class="archive-import__project">
        <span class="archive-import__project-icon"><AIcon type="ApartmentOutlined" /></span>
        <div>
          <span class="archive-import__label">{{ t('ReportSystem.Archive.project') }}</span>
          <strong>{{ projectName }}</strong>
        </div>
        <AIcon type="LockOutlined" />
      </div>
      <p class="archive-import__hint">{{ t('ReportSystem.Archive.importProjectHint') }}</p>
      <a-form
        v-if="kind === 'customer'"
        layout="vertical"
      >
        <a-form-item
          :label="t('ReportSystem.Archive.customerType')"
          required
        >
          <a-radio-group
            v-model:value="customerType"
            :disabled="busy"
          >
            <a-radio-button value="person">{{ t('ReportSystem.Archive.person') }}</a-radio-button>
            <a-radio-button value="company">{{ t('ReportSystem.Archive.company') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
      <div class="archive-import__guide">
        <div>
          <h3>{{ t('ReportSystem.Archive.importGuide') }}</h3>
          <p>{{ t('ReportSystem.Archive.' + (kind === 'customer' ? 'importGuideText' : 'houseImportGuideText')) }}</p>
        </div>
        <a-button
          :loading="busy"
          :disabled="kind === 'customer' && !customerType"
          @click="emit('template', customerType)"
        >
          <template #icon><AIcon type="DownloadOutlined" /></template>
          {{ t('ReportSystem.Archive.template') }}
        </a-button>
      </div>
      <a-upload-dragger
        accept=".xlsx,.xls"
        :multiple="false"
        :show-upload-list="false"
        :before-upload="choose"
        :disabled="busy || (kind === 'customer' && !customerType)"
      >
        <div class="archive-import__upload-icon"><AIcon type="FileExcelOutlined" /></div>
        <p class="archive-import__drop">{{ t('ReportSystem.Archive.importDrop') }}</p>
        <p class="archive-import__hint">{{ t('ReportSystem.Archive.importFileHint') }}</p>
      </a-upload-dragger>
      <div
        v-if="file"
        class="archive-import__file"
        role="status"
      >
        <AIcon type="FileExcelOutlined" />
        <span>
          {{ file.name }}
          <small>{{ (file.size / 1024).toFixed(1) }} KB</small>
        </span>
        <a-button
          type="text"
          :disabled="busy"
          :aria-label="t('ReportSystem.Archive.removeFile')"
          @click="file = undefined"
        >
          <AIcon type="DeleteOutlined" />
        </a-button>
      </div>
    </div>
    <template #footer>
      <a-button
        :disabled="busy"
        @click="emit('close')"
      >
        {{ t('ReportSystem.Archive.cancel') }}
      </a-button>
      <a-button
        type="primary"
        :disabled="!file || (kind === 'customer' && !customerType)"
        :loading="busy"
        @click="file && emit('upload', file, customerType)"
      >
        {{ t('ReportSystem.Archive.importStart') }}
      </a-button>
    </template>
  </a-modal>
</template>
<style scoped src="./ArchiveImportDialog.css"></style>
