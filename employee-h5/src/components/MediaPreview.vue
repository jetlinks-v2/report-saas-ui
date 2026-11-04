<script setup lang="ts">
defineProps<{preview?:{url:string;type:string;name:string}}>()
defineEmits<{close:[]}>()
</script>
<template><a-modal :open="!!preview" title="附件预览" :footer="null" @cancel="$emit('close')"><template v-if="preview"><img v-if="preview.type.startsWith('image/')" :src="preview.url" :alt="preview.name" class="preview-image"><video v-else-if="preview.type.startsWith('video/')" :src="preview.url" controls class="preview-image" playsinline /><audio v-else-if="preview.type.startsWith('audio/')" :src="preview.url" controls /><a v-else :href="preview.url" :download="preview.name">下载 {{preview.name}}</a></template></a-modal></template>
