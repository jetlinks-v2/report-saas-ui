<template>
  <a-button :disabled="!options.length" @click="show">{{$t('ReportRepair.selectDescriptionCount', {count:value.length})}}</a-button>
  <a-modal :open="open" :title="$t('ReportRepair.selectIssueDescriptions')" width="720px" @ok="confirm" @cancel="cancel">
    <a-space style="margin-bottom:16px"><a-input-search v-model:value="search" :placeholder="$t('ReportRepair.searchDescriptionsOrTags')" allow-clear /><a-button @click="clear">{{$t('ReportRepair.clearSelection')}}</a-button></a-space>
    <a-checkbox-group v-model:value="draft" style="display:block;max-height:420px;overflow:auto">
      <section v-for="group in groups" :key="group.name"><a-divider orientation="left">{{group.name}}</a-divider><a-checkbox v-for="item in group.items" :key="item.value" :value="item.value" style="display:flex;margin:12px 0;white-space:pre-wrap">{{item.label}}</a-checkbox></section>
    </a-checkbox-group>
    <a-empty v-if="!groups.length" :description="$t('ReportRepair.noMatchingDescriptions')" />
  </a-modal>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SelectOption } from '../types'
import { useDescriptionPicker } from '../hooks/useDescriptionPicker'
const { t: $t } = useI18n()
const props=defineProps<{value:string[];options:SelectOption[]}>()
const emit=defineEmits<{'update:value':[value:string[]]}>()
const {open,draft,search,groups,show,confirm,cancel,clear}=useDescriptionPicker(props,value=>emit('update:value',value))
</script>
