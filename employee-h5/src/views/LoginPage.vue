<script setup lang="ts">
import {onMounted,reactive} from 'vue'
import {useSession} from '../hooks/useSession'
const vm=reactive(useSession());onMounted(()=>void vm.reloadCaptcha())
</script>
<template><section class="login-page"><div class="login-brand">报事报修<span>员工工作台</span></div><div class="panel"><h1>员工登录</h1><p class="muted">使用当前项目的 SaaS 员工账号</p><a-alert v-if="vm.error" :message="vm.error" type="error" show-icon /><a-form layout="vertical" :model="vm.form" @finish="vm.login">
 <a-form-item label="项目编码" name="tenantDomain" :rules="[{required:true,message:'请输入项目编码'}]"><a-input v-model:value="vm.form.tenantDomain" autocomplete="organization" /></a-form-item>
 <a-form-item label="员工账号" name="username" :rules="[{required:true,message:'请输入员工账号'}]"><a-input v-model:value="vm.form.username" autocomplete="username" /></a-form-item>
 <a-form-item label="密码" name="password" :rules="[{required:true,message:'请输入密码'}]"><a-input-password v-model:value="vm.form.password" autocomplete="current-password" /></a-form-item>
 <a-form-item v-if="vm.captcha" label="验证码" name="verifyCode" :rules="[{required:true,message:'请输入验证码'}]"><div class="captcha-row"><a-input v-model:value="vm.form.verifyCode" autocomplete="off" :maxlength="8" /><button type="button" aria-label="刷新验证码" @click="vm.reloadCaptcha"><img :src="vm.captcha" alt="图片验证码"></button></div></a-form-item>
 <a-button type="primary" html-type="submit" block :loading="vm.loading" size="large">登录</a-button>
 </a-form></div><p class="login-footnote">统一账号 · 项目权限 · 跨端协同</p></section></template>
