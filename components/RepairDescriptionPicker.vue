<template>
  <a-button :disabled="!options.length" @click="show">选择描述（{{value.length}}）</a-button>
  <a-modal :open="open" title="选择报事描述" width="720px" @ok="confirm" @cancel="cancel">
    <a-space style="margin-bottom:16px"><a-input-search v-model:value="search" placeholder="搜索描述或标签" allow-clear /><a-button @click="clear">清空选择</a-button></a-space>
    <a-checkbox-group v-model:value="draft" style="display:block;max-height:420px;overflow:auto">
      <section v-for="group in groups" :key="group.name"><a-divider orientation="left">{{group.name}}</a-divider><a-checkbox v-for="item in group.items" :key="item.value" :value="item.value" style="display:flex;margin:12px 0;white-space:pre-wrap">{{item.label}}</a-checkbox></section>
    </a-checkbox-group>
    <a-empty v-if="!groups.length" description="暂无匹配描述" />
  </a-modal>
</template>
<script setup lang="ts">
import type { SelectOption } from '../types'
import { useDescriptionPicker } from '../hooks/useDescriptionPicker'
const props=defineProps<{value:string[];options:SelectOption[]}>()
const emit=defineEmits<{'update:value':[value:string[]]}>()
const {open,draft,search,groups,show,confirm,cancel,clear}=useDescriptionPicker(props,value=>emit('update:value',value))
</script>
