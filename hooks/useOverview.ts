import i18n from '@jetlinks-web-core/locales'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { encodeConditionFilterQuery } from '@jetlinks-web-core/components/ConditionFilter'
import { orderFilterFields } from '../services/reports'
import dayjs, { type Dayjs } from 'dayjs'
import type { EChartsCoreOption } from 'echarts/core'
import { queryDashboard, queryStatistics, queryProjects } from '../api'
import type { Dashboard, ReportRow } from '../types'
import { errorMessage, result, statusNames } from '../utils'
const { t } = i18n.global

/** 全量卡片和项目占比不随走势日期切换；图表按上海时区补零，复用后端资产查询范围。 */
export function useOverview() {
  const route=useRoute(),router=useRouter()
  const loading=ref(false),error=ref(''),period=ref('week')
  const range=ref<[Dayjs,Dayjs]>([dayjs().startOf('week'),dayjs().endOf('week')])
  const summary=ref<ReportRow[]>([]),projectTotal=ref(0)
  const dashboard=ref<Dashboard>({trend:[],urgency:[],category:[]})
  const overall=computed(()=>summary.value.reduce((sum,row)=>sum+Number(row.total||0),0))
  const cards=computed(()=>[
    {name:t('ReportRepair.totalIssues'),count:overall.value,clickable:true},{name:t('ReportRepair.totalProjects'),count:projectTotal.value},
    {name:t('ReportRepair.activeProjects'),count:summary.value.length},{name:t('ReportRepair.inactiveProjects'),count:Math.max(0,projectTotal.value-summary.value.length)},
  ])
  const counts=computed(()=>[0,6,7,1,8,9,5].map((status,index)=>({name:statusNames[status],count:summary.value.reduce((sum,row)=>sum+Number(row[['noDistributed','waitAccept','waitFollow','handling','waitCallback','waitAudit','archived'][index]]||0),0)})))
  const projects=computed(()=>summary.value.map<ReportRow & {rate:number}>(row=>({...row,rate:overall.value?Number((Number(row.total)/overall.value*100).toFixed(2)):0}))
    .sort((a,b)=>Number(b.total)-Number(a.total)))
  const projectPagination=reactive({current:1,pageSize:4})
  const changeProjectPage=(page:{current?:number;pageSize?:number})=>{
    projectPagination.current=page.current||1;projectPagination.pageSize=page.pageSize||4
  }
  const openOrders=(projectId?:string)=>{
    const q=encodeConditionFilterQuery(projectId?[{column:'businessProjectId',termType:'eq',value:projectId}]:[],
      orderFilterFields(projects.value.map(row=>({value:row.projectId,label:row.projectName}))))||undefined
    void router.push({path:'/businessProcessing/reportedThatRecords',query:{...route.query,q}})
  }
  const interval=computed(()=>'year'===period.value||range.value[1].diff(range.value[0],'day')>90?'month':'day')
  const trend=computed(()=>{
    const rows=[];let cursor=range.value[0].startOf(interval.value),end=range.value[1].startOf(interval.value)
    for(let index=0;index<367&&!cursor.isAfter(end);index++,cursor=cursor.add(1,interval.value)){
      const name=cursor.format(interval.value==='month'?'YYYY-MM':'YYYY-MM-DD')
      rows.push(dashboard.value.trend.find(row=>row.name===name)||{name,total:0,noDistributed:0,handling:0,abandoned:0})
    }
    return rows
  })
  const trendOption=computed<EChartsCoreOption>(()=>({tooltip:{trigger:'axis'},legend:{bottom:0},grid:{left:45,right:20,top:20,bottom:65},xAxis:{type:'category',data:trend.value.map(row=>row.name)},yAxis:{type:'value',minInterval:1},series:([
    ['total',t('ReportRepair.totalIssues'),'bar'],['noDistributed',t('ReportRepair.awaitingAssignment'),'line'],['handling',t('ReportRepair.inProgress'),'line'],['abandoned',t('ReportRepair.statusDiscarded'),'line']
  ] as const).map(([key,name,type])=>({name,type,data:trend.value.map(row=>row[key])}))}))
  const pie=(rows:{name:string;total:number}[]):EChartsCoreOption=>({tooltip:{trigger:'item'},legend:{bottom:0},series:[{type:'pie',radius:['40%','65%'],center:['50%','44%'],data:rows.map(row=>({name:row.name,value:row.total})),label:{formatter:'{b}: {c}'}}]})
  const urgencyOption=computed(()=>pie(dashboard.value.urgency.map(row=>({...row,name:({'0':t('ReportRepair.notSet'),'1':t('ReportRepair.urgencyNormal'),'2':t('ReportRepair.urgent'),'3':t('ReportRepair.veryUrgent')} as Record<string,string>)[row.name]||row.name}))))
  const categoryOption=computed(()=>pie(dashboard.value.category))
  let sequence=0
  const load=async()=>{
    if(!range.value?.[0]||!range.value?.[1])return
    if(range.value[1].diff(range.value[0],'day')>366){error.value=t('ReportRepair.selectADateRangeOfUpToOneYear');return}
    const current=++sequence;loading.value=true;error.value=''
    try {
      const [statistics,organizations,charts]=await Promise.all([
        queryStatistics({}),queryProjects(),
        queryDashboard({terms:[{column:'createTime',termType:'btw',value:[range.value[0].startOf('day').valueOf(),range.value[1].endOf('day').valueOf()]}]},interval.value)
      ])
      if(current!==sequence)return
      summary.value=result(statistics);projectTotal.value=result(organizations).length;dashboard.value=result(charts)
      if((projectPagination.current-1)*projectPagination.pageSize>=projects.value.length)projectPagination.current=1
    }catch(e){if(current===sequence)error.value=errorMessage(e)}finally{if(current===sequence)loading.value=false}
  }
  const changePeriod=(value:string)=>{period.value=value;const unit=value==='week'?'week':value==='month'?'month':'year';range.value=[dayjs().startOf(unit),dayjs().endOf(unit)];void load()}
  const changeRange=()=>{period.value='custom';void load()}
  onMounted(load)
  return {loading,error,period,range,cards,counts,projects,projectPagination,changeProjectPage,openOrders,dashboard,trendOption,urgencyOption,categoryOption,load,changePeriod,changeRange}
}
