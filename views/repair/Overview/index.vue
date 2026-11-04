<template>
  <a-card :title="$t('ReportRepair.overview')"><template #extra><a-button :loading="loading" @click="load">{{$t('ReportRepair.refresh')}}</a-button></template>
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-bottom:16px" />
    <a-spin :spinning="loading">
      <a-row :gutter="16"><a-col v-for="item in cards" :key="item.name" :xs="12" :lg="6"><a-card size="small"><a-statistic :title="item.name" :value="item.count" :suffix="$t('ReportRepair.countUnit')"><template v-if="item.clickable" #formatter><a-button type="link" class="overview-total" :aria-label="$t('ReportRepair.viewAllIssueRecords')" @click="openOrders()">{{item.count}}</a-button></template></a-statistic></a-card></a-col></a-row>
      <a-row :gutter="16" style="margin-top:16px"><a-col v-for="item in counts" :key="item.name" :xs="12" :lg="3"><a-statistic :title="item.name" :value="item.count" /></a-col></a-row>
      <a-row :gutter="16" style="margin-top:24px">
        <a-col :xs="24" :xl="16"><a-card :title="$t('ReportRepair.issueAndRepairTrends')" size="small">
          <template #extra><a-space wrap><a-radio-group :value="period" size="small" @update:value="changePeriod"><a-radio-button value="week">{{$t('ReportRepair.thisWeek')}}</a-radio-button><a-radio-button value="month">{{$t('ReportRepair.thisMonth')}}</a-radio-button><a-radio-button value="year">{{$t('ReportRepair.thisYear')}}</a-radio-button></a-radio-group><a-range-picker v-model:value="range" :allow-clear="false" size="small" @change="changeRange" /></a-space></template>
          <Echarts :option="trendOption" style="height:340px" @error="chartError" />
        </a-card></a-col>
        <a-col :xs="24" :xl="8"><a-card :title="$t('ReportRepair.issuesByUrgency')" size="small"><Echarts v-if="dashboard.urgency.length" :option="urgencyOption" style="height:340px" @error="chartError" /><a-empty v-else :description="$t('ReportRepair.noIssuesInThisDateRange')" style="height:340px;padding-top:80px" /></a-card></a-col>
      </a-row>
      <a-row :gutter="16" style="margin-top:16px">
        <a-col :xs="24" :lg="12"><a-card :title="$t('ReportRepair.issuesByCategory')" size="small"><Echarts v-if="dashboard.category.length" :option="categoryOption" style="height:360px" @error="chartError" /><a-empty v-else :description="$t('ReportRepair.noIssuesInThisDateRange')" style="height:360px;padding-top:80px" /></a-card></a-col>
        <a-col :xs="24" :lg="12"><a-card :title="$t('ReportRepair.issuesByProject')" size="small"><a-table :data-source="projects" row-key="projectId" size="small" :pagination="{...projectPagination,showSizeChanger:true,showQuickJumper:true,pageSizeOptions:['4','8','12']}" @change="changeProjectPage"><a-table-column key="index" :title="$t('ReportRepair.rowNumber')" :width="60"><template #default="{index}">{{(projectPagination.current-1)*projectPagination.pageSize+index+1}}</template></a-table-column><a-table-column key="name" :title="$t('ReportRepair.projectName')"><template #default="{record}"><a-button type="link" @click="openOrders(record.projectId)">{{record.projectName}}</a-button></template></a-table-column><a-table-column key="total" :title="$t('ReportRepair.issueCount')" data-index="total" /><a-table-column key="rate" :title="$t('ReportRepair.share')"><template #default="{record}"><a-progress :percent="record.rate" size="small" /></template></a-table-column></a-table></a-card></a-col>
      </a-row>
    </a-spin>
  </a-card>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Echarts from '@jetlinks-web-core/components/Echarts/Echarts.vue'
import { useOverview } from '../../../hooks/useOverview'
const { t: $t } = useI18n()
const {loading,error,period,range,cards,counts,projects,projectPagination,changeProjectPage,openOrders,dashboard,trendOption,urgencyOption,categoryOption,load,changePeriod,changeRange}=useOverview()
const chartError=()=>{error.value=$t('ReportRepair.unableToLoadChartsRefreshAndRetry')}
</script>
<style scoped>
.overview-total{height:auto;padding:0;font-size:inherit;line-height:inherit}
</style>
