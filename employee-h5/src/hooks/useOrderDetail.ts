import {computed,ref,watch} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import * as api from '../api/repair'
import {errorText} from '../api/http'
import {availableActions,handlingDuration} from '../services/orderActions'
import {useMedia} from './useMedia'
import type {Configuration,Order,Process,Review} from '../types'
export function useOrderDetail(){
 const route=useRoute(),router=useRouter(),order=ref<Order>(),history=ref<Process[]>([]),reviews=ref<Review[]>([]),configs=ref<Configuration[]>([]),loading=ref(false),error=ref('')
 const media=useMedia(text=>error.value=text)
 let sequence=0
 const load=async()=>{
  const own=++sequence;loading.value=true;error.value=''
  try{const id=String(route.params.id),[o,h,r]=await Promise.all([api.order(id),api.history(id),api.reviews(id)]);const c=await api.configurations(o.businessProjectId);if(own!==sequence)return;order.value=o;history.value=h;reviews.value=r;configs.value=c.data}catch(e){if(own===sequence)error.value=errorText(e)}finally{if(own===sequence)loading.value=false}
 }
 const actions=computed(()=>order.value?availableActions(order.value,reviews.value,configs.value):[])
 const duration=computed(()=>order.value?handlingDuration(order.value,history.value):'—')
 const perform=(action:string)=>router.push(`/orders/${order.value!.id}/action/${action}`)
 watch(()=>route.params.id,()=>void load(),{immediate:true})
 return{order,history,reviews,configs,loading,error,load,actions,duration,perform,...media}
}
