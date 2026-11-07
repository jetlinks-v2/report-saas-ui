<script setup lang="ts">
import {reactive} from 'vue'
import {EnvironmentOutlined,UserOutlined,LockOutlined} from '@ant-design/icons-vue'
import {useSession} from '../hooks/useSession'
import LoginVerification from '../components/LoginVerification.vue'
const vm=reactive(useSession())
</script>
<template><section class="login-page"><div class="login-hero"><div class="login-brand">报事报修<span>员工工作台</span><p>及时响应 · 用心服务</p></div><img src="/images/report/repair-toolkit.svg" alt="" fetchpriority="high" /></div><div class="panel"><h1>欢迎使用</h1><p class="muted">填写项目编码，使用应用账号登录</p><a-alert v-if="vm.error" :message="vm.error" type="error" show-icon /><a-form layout="vertical" :model="vm.form" @finish="vm.login">
 <a-form-item label="项目编码" name="tenantDomain" :rules="[{required:true,whitespace:true,message:'请输入项目编码'}]"><a-input v-model:value="vm.form.tenantDomain" placeholder="请输入项目编码" autocomplete="off" :disabled="vm.loading"><template #prefix><EnvironmentOutlined aria-hidden="true" /></template></a-input></a-form-item>
 <a-form-item label="应用账号" name="username" :rules="[{required:true,whitespace:true,message:'请输入应用账号'}]"><a-input v-model:value="vm.form.username" placeholder="请输入应用账号" autocomplete="username" :disabled="vm.loading"><template #prefix><UserOutlined aria-hidden="true" /></template></a-input></a-form-item>
 <a-form-item label="密码" name="password" :rules="[{required:true,message:'请输入密码'}]"><a-input-password v-model:value="vm.form.password" placeholder="请输入密码" autocomplete="current-password" :disabled="vm.loading"><template #prefix><LockOutlined aria-hidden="true" /></template></a-input-password></a-form-item>
 <a-button type="primary" html-type="submit" block :loading="vm.loading" size="large">登录</a-button>
 </a-form></div><p class="login-footnote">应用账号 · 项目权限 · 跨端协同</p><LoginVerification v-if="vm.verification" :requirement="vm.verification" @success="vm.completeVerification" @cancel="vm.cancelVerification" /></section></template>
