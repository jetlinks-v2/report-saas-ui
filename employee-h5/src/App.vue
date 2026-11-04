<script setup lang="ts">
import {useRoute,useRouter} from 'vue-router'
import {computed} from 'vue'
import {HomeOutlined,UnorderedListOutlined,PlusOutlined,UserOutlined,TeamOutlined,CarryOutOutlined,LeftOutlined} from '@ant-design/icons-vue'
import {can} from './services/session'
import {actionNames} from './services/labels'
const route=useRoute(),router=useRouter()
const login=computed(()=>route.path==='/login'),home=computed(()=>route.path==='/'),detail=computed(()=>!['/','/orders','/profile','/login'].includes(route.path))
const title=computed(()=>route.path==='/create'?'发起报事':route.params.action?actionNames[String(route.params.action)]||'处理工单':route.params.id?'工单详情':route.path==='/profile'?'我的':({pool:'工单池',todo:'我的待办',related:'与我相关',paid:'有偿报事',review:'报事审核',warning:'物业预警',unfinished:'未完成报事'}[String(route.query.mode||'pool')]||'工单池'))
function back(){if(window.history.state?.back)router.back();else void router.replace('/')}
</script>
<template>
 <div class="app-shell">
  <header v-if="!login&&!home" class="topbar">
   <a-button type="text" class="back-button" aria-label="返回" @click="back"><LeftOutlined /></a-button>
   <h1>{{title}}</h1><router-link v-if="route.path==='/orders'&&can('create')" class="header-side" to="/create" aria-label="发起报事"><PlusOutlined /></router-link><span v-else class="header-side"></span>
  </header>
  <main><router-view /></main>
  <nav v-if="!login&&!detail" class="bottom-nav" aria-label="主导航">
   <router-link to="/" :class="{active:home}"><HomeOutlined /><span>工作台</span></router-link>
   <router-link to="/orders?mode=pool" :class="{active:route.path==='/orders'&&!['related','todo'].includes(String(route.query.mode))}"><UnorderedListOutlined /><span>工单池</span></router-link>
   <router-link to="/orders?mode=todo" :class="{active:route.query.mode==='todo'}"><CarryOutOutlined /><span>我的待办</span></router-link>
   <router-link to="/orders?mode=related" :class="{active:route.query.mode==='related'}"><TeamOutlined /><span>与我相关</span></router-link>
   <router-link to="/profile" :class="{active:route.path==='/profile'}"><UserOutlined /><span>我的</span></router-link>
  </nav>
 </div>
</template>
