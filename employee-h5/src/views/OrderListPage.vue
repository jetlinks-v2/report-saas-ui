<script setup lang="ts">
import {reactive,ref} from 'vue'
import {FilterOutlined,ReloadOutlined} from '@ant-design/icons-vue'
import {useOrderList} from '../hooks/useOrderList'
import {reviewNames,name} from '../services/labels'
import OrderCard from '../components/OrderCard.vue'
const vm=reactive(useOrderList()),filterOpen=ref(false)
function selectStatus(status:number){vm.status=status;vm.search()}
</script>
<template>
 <section class="page list-page">
  <div class="list-toolbar">
   <div v-if="!['review','warning','unfinished'].includes(vm.mode)" class="status-tabs" role="tablist" :aria-label="vm.mode==='todo'?'待办类型':'工单状态'"><a-button v-for="tab in vm.tabs" :key="tab.value" type="text" role="tab" :aria-selected="vm.status===tab.value" :class="{selected:vm.status===tab.value}" @click="selectStatus(tab.value)">{{tab.value===-1&&vm.mode!=='todo'?'全部':tab.label}}</a-button></div>
   <div v-else-if="vm.mode==='review'" class="status-tabs" role="tablist" aria-label="审核状态"><a-button v-for="tab in [{value:1,label:'待审核'},{value:2,label:'审核通过'},{value:3,label:'审核不通过'}]" :key="tab.value" type="text" role="tab" :aria-selected="vm.reviewStatus===tab.value" :class="{selected:vm.reviewStatus===tab.value}" @click="vm.reviewStatus=tab.value;vm.search()">{{tab.label}}</a-button></div>
   <div v-else-if="vm.mode==='warning'" class="status-tabs" role="tablist" aria-label="预警类型"><a-button v-for="tab in [{value:'soon',label:'即将超时'},{value:'overdue',label:'已超时'}]" :key="tab.value" type="text" role="tab" :aria-selected="vm.warning===tab.value" :class="{selected:vm.warning===tab.value}" @click="vm.warning=tab.value;vm.search()">{{tab.label}}</a-button></div>
   <div class="search-filter-shell"><a-input-search v-model:value="vm.keyword" placeholder="编号 / 描述 / 报事人" allow-clear @search="vm.search" /><a-button type="text" class="filter-entry" aria-label="筛选工单" @click="filterOpen=true"><FilterOutlined />筛选<span v-if="vm.state.projectId||vm.reviewKind" class="filter-dot"></span></a-button></div>
  </div>
  <div class="list-content">
   <a-alert v-if="vm.error" :message="vm.error" type="error" show-icon />
   <p v-if="vm.purpose" class="list-purpose">{{vm.purpose}}</p><div class="list-caption"><span class="list-total">共 {{vm.total}} 条记录</span><a-button type="text" size="small" aria-label="刷新工单" @click="vm.load(false)"><ReloadOutlined /></a-button></div>
   <a-spin :spinning="vm.loading"><div class="order-list"><OrderCard v-for="order in vm.rows" :key="order.reviewId||order.id" :order="order" :actions="vm.cardActions(order)" @open="vm.open" @action="vm.perform" /></div><a-empty v-if="!vm.loading&&!vm.rows.length" description="暂无符合条件的工单" /></a-spin>
   <a-button v-if="vm.rows.length<vm.total" block :loading="vm.loading" @click="vm.load(true)">加载更多</a-button><p v-else-if="vm.rows.length" class="list-end">没有更多了</p>
  </div>
  <a-drawer v-model:open="filterOpen" title="筛选工单" placement="bottom" height="auto" class="mobile-drawer"><a-form layout="vertical" class="list-filters"><a-form-item label="业务项目"><a-select v-model:value="vm.state.projectId" allow-clear show-search option-filter-prop="label" placeholder="全部授权项目" :options="vm.projects.map(p=>({value:p.id,label:name(p)}))" /></a-form-item><a-form-item v-if="!['review','warning','unfinished'].includes(vm.mode)" :label="vm.mode==='todo'?'待办类型':'工单状态'"><a-select v-model:value="vm.status" :options="vm.tabs" @change="vm.search" /></a-form-item><a-form-item v-if="vm.mode==='review'" label="审核类型"><a-select v-model:value="vm.reviewKind" allow-clear placeholder="全部审核类型" :options="Object.entries(reviewNames).map(([value,label])=>({value,label}))" @change="vm.search" /></a-form-item></a-form><a-button type="primary" block @click="filterOpen=false;vm.search()">确定</a-button></a-drawer>
 </section>
</template>
