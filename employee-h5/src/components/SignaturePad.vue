<script setup lang="ts">
import {onMounted,ref} from 'vue'
const emit=defineEmits<{capture:[file:File]}>(),canvas=ref<HTMLCanvasElement>();let drawing=false,last:{x:number;y:number}|undefined,hasInk=false
const point=(e:PointerEvent)=>{const c=canvas.value!,r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}
const down=(e:PointerEvent)=>{canvas.value!.setPointerCapture(e.pointerId);drawing=true;last=point(e)}
const move=(e:PointerEvent)=>{if(!drawing||!last)return;const next=point(e),ctx=canvas.value!.getContext('2d')!;ctx.strokeStyle='#172c25';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(next.x,next.y);ctx.stroke();last=next;hasInk=true}
const clear=()=>{const c=canvas.value!;c.getContext('2d')!.clearRect(0,0,c.width,c.height);hasInk=false}
const capture=()=>{if(!hasInk)return;canvas.value!.toBlob(blob=>{if(blob)emit('capture',new File([blob],'业主签字.png',{type:'image/png'}))},'image/png')}
onMounted(()=>{canvas.value!.width=640;canvas.value!.height=320})
</script>
<template><div class="signature"><canvas ref="canvas" aria-label="业主手写签字" @pointerdown="down" @pointermove="move" @pointerup="drawing=false" @pointercancel="drawing=false" /><div class="signature-actions"><a-button @click="clear">重写</a-button><a-button @click="capture">使用此签字</a-button></div></div></template>
