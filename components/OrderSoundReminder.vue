<template>
  <template v-if="visible">
    <a-button type="text" :loading="loading" :danger="blocked" @click="show">工单提示音{{ saved.enabled ? ' · 开' : ' · 关' }}</a-button>
    <a-modal v-model:open="open" title="个人工单提示音" :confirm-loading="saving" :ok-button-props="{ disabled: loading }" @ok="save">
      <a-form layout="vertical">
        <a-form-item label="新工单提示音"><a-switch v-model:checked="form.enabled" aria-label="新工单提示音" /></a-form-item>
        <a-form-item label="重复次数"><a-input-number v-model:value="form.repeatTimes" :min="1" :precision="0" aria-label="重复次数" /> 次</a-form-item>
        <a-form-item label="刷新间隔"><a-input-number v-model:value="form.intervalMinutes" :min="1" :precision="0" aria-label="刷新间隔" /> 分钟</a-form-item>
      </a-form>
      <p>仅对当前账号生效。开启后首次刷新记录现有工单，后续提醒新增待分派工单；在本应用切换页面仍保持提醒。</p>
      <a-space><a-button @click="trySound">试听提示音</a-button><a-button v-if="error" :loading="loading" @click="load">重新读取设置</a-button></a-space>
      <a-alert v-if="blocked" message="浏览器未允许播放，请点击试听开启声音，或检查站点声音设置。" type="warning" show-icon style="margin-top:12px" />
      <a-alert v-if="error || pollingError" :message="error || pollingError" type="error" show-icon style="margin-top:12px" />
    </a-modal>
  </template>
</template>
<script setup lang="ts">
import { useOrderSound } from '../hooks/useOrderSound'
const { visible, open, loading, saving, blocked, error, pollingError, saved, form, save, show, trySound, load } = useOrderSound()
</script>
