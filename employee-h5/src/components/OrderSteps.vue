<script setup lang="ts">
import {computed} from 'vue'
const props=defineProps<{status?:number}>()
const current=computed(()=>props.status===undefined||props.status===0?0:props.status===6?1:[1,7].includes(props.status)?2:3)
</script>
<template><div class="order-steps"><a-steps :current="current" :status="status===3?'error':[2,4,5].includes(status??-1)?'finish':'process'" :responsive="false" size="small" label-placement="vertical" progress-dot :items="[{title:'发起报事'},{title:'分派'},{title:'处理'},{title:'完成'}]" /></div></template>
