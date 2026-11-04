<template>
  <Levels v-if="isLevel" />
  <General v-else />
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const isLevel = computed(() => route.path.split('/').pop() === 'reportLevel')
const Levels = defineAsyncComponent(() => import('./Levels.vue'))
const General = defineAsyncComponent(() => import('./General.vue'))
</script>
