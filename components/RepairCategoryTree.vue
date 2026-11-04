<template>
  <aside class="category-panel">
    <a-space class="category-heading"><strong>分类名称</strong><a-button v-if="state.canSave" type="link" @click="emit('add')">新增一级分类</a-button></a-space>
    <a-button v-if="state.selectedKeys.length" type="link" @click="emit('select',[])">清除分类筛选</a-button>
    <a-spin :spinning="state.loading">
      <a-empty v-if="!state.nodes.length" description="暂无报事分类" />
      <a-tree v-else :tree-data="state.nodes" :selected-keys="state.selectedKeys" :default-expand-all="true" block-node @select="(keys:(string|number)[])=>emit('select',keys.map(String))">
        <template #title="node">
          <div class="category-node"><span :title="node.title">{{node.title}}</span><a-space v-if="state.canSave&&node.row" :size="0">
            <a-button v-if="node.depth<3" type="link" size="small" @click.stop="emit('add',node.row)">添加</a-button>
            <a-button type="link" size="small" @click.stop="emit('edit',node.row)">编辑</a-button><a-popconfirm title="删除此分类？存在子级或引用时将拒绝删除。" @confirm="emit('remove',node.row)"><a-button type="link" size="small" danger @click.stop>删除</a-button></a-popconfirm>
          </a-space></div>
        </template>
      </a-tree>
    </a-spin>
  </aside>
</template>
<script setup lang="ts">
import type { Configuration } from '../types'
import type { ConfigurationTreeNode } from '../services/configurationSearch'
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
