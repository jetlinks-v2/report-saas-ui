<script setup lang="ts">
defineProps<{ids:string[];names:Record<string,string>;loading:boolean;disabled?:boolean;single?:boolean}>()
const emit=defineEmits<{files:[files:File[]];remove:[id:string];preview:[id:string]}>()
const changed=(event:Event)=>{const input=event.target as HTMLInputElement;emit('files',Array.from(input.files||[]));input.value=''}
</script>
<template>
 <div class="media-input">
  <div v-for="(id,index) in ids" :key="id" class="file-row"><button type="button" class="text-button" @click="emit('preview',id)">{{names[id]||'附件 '+(index+1)}}</button><a-button v-if="!disabled" size="small" :disabled="loading" @click="emit('remove',id)">移除</a-button></div>
  <label v-if="!disabled" class="file-picker" :class="{disabled:loading}"><input type="file" accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip" :multiple="!single" :disabled="loading" @change="changed">{{loading?'正在上传…':single?'选择图片或拍照':'拍照 / 选择附件'}}</label>
 </div>
</template>
