export const statuses=['待分派','处理中','已完结','已废弃','已关闭','已归档','待接单','待跟进','待回访','待审核']
export const statusOptions=[-1,0,6,7,1,8,9,2,5,4,3].map(value=>({value,label:value===-1?'全部状态':statuses[value]}))
export const todoStatusOptions=[-1,6,7,1,8,9].map(value=>({value,label:value===-1?'全部待办':statuses[value]}))
export const actionNames:Record<string,string>={create:'发起报事',dispatch:'分派',grab:'抢单',accept:'接单',follow:'跟进',finish:'完结',transfer:'转派',delay:'申请延期',close:'非正常关单申请',changeCategory:'修改分类',changeLevel:'修改等级',abandonApply:'申请废弃',review:'审核',callback:'回访',evaluate:'员工评价',ownerEvaluate:'登记业主评价',toPaid:'转为有偿',quote:'提交费用待签字',sign:'登记业主签字',urge:'催办',archive:'归档',autoDispatch:'自动分派',timeout:'处理超时',autoEvaluate:'系统默认评价'}
export const reviewNames:Record<string,string>={delay:'延期审核',close:'非关审核',abandon:'废弃审核',levelChange:'等级变更审核',archive:'归档前等级审核'}
export const name=(r:{displayName?:string;sourceName?:string})=>r.displayName||r.sourceName||''
export const time=(n?:number)=>n?new Date(n).toLocaleString('zh-CN',{hour12:false}):'—'
export const money=(n?:number)=>(n||0).toFixed(2)
export const urgencyName=(n?:number)=>(['—','一般','紧急','非常紧急'][n||0]||'—')
