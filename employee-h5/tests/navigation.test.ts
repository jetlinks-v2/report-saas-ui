import {test} from 'node:test'
import assert from 'node:assert/strict'
import {isOrderScope,orderListTitle,orderScopeQuery} from '../src/services/navigation'
import {listQuery} from '../src/services/queries'

test('切换工单范围清除不兼容的状态和审核条件，并保留关键词、日期',()=>{
 const query=orderScopeQuery({mode:'pool',status:'5',keyword:'照明',start:'2026-11-01',end:'2026-11-07',warning:'overdue',reviewStatus:'3',reviewKind:'delay'},'todo')
 assert.deepEqual(query,{mode:'todo',status:-1,keyword:'照明',start:'2026-11-01',end:'2026-11-07',warning:undefined,reviewStatus:undefined,reviewKind:undefined})
 assert.equal(orderScopeQuery({mode:'todo',status:'9'},'related').status,-1)
})

test('整合导航后，三个范围继续使用各自的查询口径及项目条件',()=>{
 const terms=(mode:'pool'|'todo'|'related',status=-1)=>listQuery(mode,status,'project-a').terms!
 assert.deepEqual(terms('pool'),[{column:'businessProjectId',value:'project-a'}])
 assert.deepEqual(terms('todo'),[{column:'businessProjectId',value:'project-a'},{column:'id',termType:'repair-todo',value:-1}])
 assert.deepEqual(terms('related'),[{column:'businessProjectId',value:'project-a'},{column:'id',termType:'repair-related',value:true}])
 // 待审核是一类待办资格，不能在切换时误用为工单主状态9。
 assert.deepEqual(terms('todo',9).at(-1),{column:'id',termType:'repair-todo',value:9})
})

test('旧链接仍识别原范围，统计钻取保留独立标题',()=>{
 for(const scope of ['pool','todo','related']){assert.equal(isOrderScope(scope),true);assert.equal(orderListTitle(scope),'工单')}
 assert.equal(isOrderScope('warning'),false)
 assert.equal(orderListTitle('warning'),'物业预警')
 assert.equal(orderListTitle('review'),'报事审核')
})
