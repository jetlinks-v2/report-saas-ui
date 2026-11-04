<template>
  <FileUpload :value="files" :disabled="disabled" :size="50" :max-count="20" :multiple="true"
    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z" :btn-text="$t('ReportRepair.uploadAttachments')" @upload-change="change" />
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { toRef } from 'vue'
import { FileUpload } from '@jetlinks-web-core/components'
import { useAttachments } from '../hooks/useAttachments'
const { t: $t } = useI18n()
const props = defineProps<{ value: string[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:value': [value: string[]]; busy: [value: boolean] }>()
const { files, change } = useAttachments(toRef(props, 'value'), value => emit('update:value', value), value => emit('busy', value))
</script>
