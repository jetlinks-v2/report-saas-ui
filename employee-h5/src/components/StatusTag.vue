<script setup lang="ts">
import {statuses} from '../services/labels'
defineProps<{status:number}>()
</script>
<template><span class="status" :class="{danger:status===3,done:[2,5].includes(status)}">{{statuses[status]||'未知状态'}}</span></template>
