<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UserIdentity } from '../../../api/system-management/user'
defineProps<{ identities: UserIdentity[] }>()
const { t } = useI18n()
</script>

<template>
  <div class="user-identity-tags">
    <a-tag
      v-for="identity in identities"
      :key="identity.value"
      :color="identity.value === 'owner' ? 'blue' : 'green'"
    >
      {{ identity.text }}
    </a-tag>
    <span
      v-if="!identities.length"
      class="user-muted"
    >
      {{ t('ReportSystem.UserManagement.unmarked') }}
    </span>
  </div>
</template>

<style scoped>
.user-identity-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.user-identity-tags :deep(.ant-tag) {
  margin: 0;
  border-radius: 4px;
}
.user-muted {
  color: var(--ant-color-text-tertiary, #8c8c8c);
}
</style>
