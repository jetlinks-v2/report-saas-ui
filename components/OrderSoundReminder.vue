<template>
  <template v-if="visible">
    <a-button type="text" :loading="loading" :danger="blocked" @click="show">{{$t('ReportRepair.orderSound')}}{{ saved.enabled ? $t('ReportRepair.soundOn') : $t('ReportRepair.off') }}</a-button>
    <a-modal v-model:open="open" :title="$t('ReportRepair.personalOrderSound')" :confirm-loading="saving" :ok-button-props="{ disabled: loading }" @ok="save">
      <a-form layout="vertical">
        <a-form-item :label="$t('ReportRepair.newOrderSound')"><a-switch v-model:checked="form.enabled" :aria-label="$t('ReportRepair.newOrderSound')" /></a-form-item>
        <a-form-item :label="$t('ReportRepair.repeatCount')"><a-input-number v-model:value="form.repeatTimes" :min="1" :precision="0" :aria-label="$t('ReportRepair.repeatCount')" />{{$t('ReportRepair.times')}}</a-form-item>
        <a-form-item :label="$t('ReportRepair.refreshInterval')"><a-input-number v-model:value="form.intervalMinutes" :min="1" :precision="0" :aria-label="$t('ReportRepair.refreshInterval')" />{{$t('ReportRepair.minutes')}}</a-form-item>
      </a-form>
      <p>{{$t('ReportRepair.appliesToYourAccountOnlyTheFirstRefreshRecords')}}</p>
      <a-space><a-button @click="trySound">{{$t('ReportRepair.previewSound')}}</a-button><a-button v-if="error" :loading="loading" @click="load">{{$t('ReportRepair.reloadSettings')}}</a-button></a-space>
      <a-alert v-if="blocked" :message="$t('ReportRepair.soundPlaybackWasBlockedPreviewTheSoundToEnable')" type="warning" show-icon style="margin-top:12px" />
      <a-alert v-if="error || pollingError" :message="error || pollingError" type="error" show-icon style="margin-top:12px" />
    </a-modal>
  </template>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrderSound } from '../hooks/useOrderSound'
const { t: $t } = useI18n()
const { visible, open, loading, saving, blocked, error, pollingError, saved, form, save, show, trySound, load } = useOrderSound()
</script>
