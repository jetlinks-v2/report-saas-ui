<template>
  <aside class="category-panel">
    <a-space class="category-heading"><strong>{{$t('ReportRepair.categoryName')}}</strong><a-button v-if="state.canSave" type="link" @click="emit('add')">{{$t('ReportRepair.addRootCategory')}}</a-button></a-space>
    <a-button v-if="state.selectedKeys.length" type="link" @click="emit('select',[])">{{$t('ReportRepair.clearCategoryFilter')}}</a-button>
    <a-spin :spinning="state.loading">
      <a-empty v-if="!state.nodes.length" :description="$t('ReportRepair.noIssueCategories')" />
      <a-tree v-else :tree-data="state.nodes" :selected-keys="state.selectedKeys" :default-expand-all="true" block-node @select="(keys:(string|number)[])=>emit('select',keys.map(String))">
        <template #title="node">
          <div class="category-node"><span :title="node.title">{{node.title}}</span><a-space v-if="state.canSave&&node.row" :size="0">
            <a-button v-if="node.depth<3" type="link" size="small" @click.stop="emit('add',node.row)">{{$t('ReportRepair.addCategoryChild')}}</a-button>
            <a-button type="link" size="small" @click.stop="emit('edit',node.row)">{{$t('ReportRepair.edit')}}</a-button><a-popconfirm :title="$t('ReportRepair.deleteThisCategoryCategoriesWithChildrenOrReferencesCannot')" @confirm="emit('remove',node.row)"><a-button type="link" size="small" danger @click.stop>{{$t('ReportRepair.delete')}}</a-button></a-popconfirm>
          </a-space></div>
        </template>
      </a-tree>
    </a-spin>
  </aside>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Configuration } from '../types'
import type { ConfigurationTreeNode } from '../services/configurationSearch'
const { t: $t } = useI18n()
defineProps<{state:{nodes:ConfigurationTreeNode[];selectedKeys:string[];canSave:boolean;loading:boolean}}>()
const emit=defineEmits<{add:[parent?:Configuration];edit:[row:Configuration];remove:[row:Configuration];select:[keys:string[]]}>()
</script>
<style scoped>
.category-panel{width:340px;flex:0 0 340px;border-right:1px solid var(--ant-color-border,#f0f0f0);padding-right:16px;max-height:80vh;overflow:auto}
.category-heading{width:100%;justify-content:space-between;margin-bottom:12px}
.category-node{display:flex;align-items:center;justify-content:space-between;gap:4px}
.category-node>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:1100px){.category-panel{width:100%;flex-basis:auto;max-height:360px;border-right:0;border-bottom:1px solid #f0f0f0;padding-bottom:12px}}
</style>
