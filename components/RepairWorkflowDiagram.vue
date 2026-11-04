<template>
  <div class="workflow-diagram">
    <svg viewBox="0 0 2100 1120" role="img" :aria-label="$t('ReportRepair.workflowDiagram')">
      <defs>
        <marker id="repair-workflow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8c8c8c" />
        </marker>
      </defs>
      <polyline v-for="(line,index) in lines" :key="index" :points="line" fill="none" stroke="#8c8c8c" stroke-width="2" marker-end="url(#repair-workflow-arrow)" />
      <g v-for="node in nodes" :key="node.id" :transform="`translate(${node.x},${node.y})`">
        <polygon v-if="node.decision" :points="`0,${node.h/2} ${node.w/2},0 ${node.w},${node.h/2} ${node.w/2},${node.h}`" fill="white" stroke="#1677ff" />
        <rect v-else :width="node.w" :height="node.h" :rx="node.terminal?20:4" :fill="node.state?'#1677ff':'white'" stroke="#1677ff" />
        <foreignObject :x="node.decision?node.w*.18:4" :width="node.decision?node.w*.64:node.w-8" :height="node.h">
          <div xmlns="http://www.w3.org/1999/xhtml" class="node-label" :class="{state:node.state}">{{ $t(`ReportRepair.${node.label}`) }}</div>
        </foreignObject>
      </g>
      <text v-for="label in branchLabels" :key="label.id" :x="label.x" :y="label.y" fill="#1677ff" font-size="15">{{ $t(`ReportRepair.${label.label}`) }}</text>
    </svg>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t: $t } = useI18n()

// 原流程图的节点和连线；将图片文字改为语言资源，流程含义与原图保持一致。
type Node = { id:string; x:number; y:number; w:number; h:number; label:string; decision?:boolean; state?:boolean; terminal?:boolean }
const nodes: Node[] = [
  {id:'start',x:10,y:10,w:180,h:40,label:'workflowStart',terminal:true},
  {id:'records',x:10,y:105,w:180,h:40,label:'issueRecords'},
  {id:'create',x:10,y:200,w:180,h:40,label:'reportAnIssue'},
  {id:'pending',x:10,y:295,w:180,h:44,label:'awaitingAssignment',state:true},
  {id:'assigned',x:10,y:390,w:180,h:64,label:'workflowAssigned',decision:true},
  {id:'assignee',x:10,y:560,w:180,h:44,label:'workflowAssignHandler'},
  {id:'assignDecision',x:205,y:300,w:190,h:64,label:'workflowAssigned',decision:true},
  {id:'orders',x:460,y:230,w:190,h:44,label:'workflowOrderMenu'},
  {id:'claim',x:420,y:325,w:200,h:64,label:'workflowClaimed',decision:true},
  {id:'sync',x:740,y:335,w:190,h:44,label:'workflowRemainUnassigned'},
  {id:'progress',x:420,y:510,w:200,h:44,label:'inProgress',state:true},
  {id:'handle',x:420,y:615,w:200,h:44,label:'workflowHandleOrder'},
  {id:'finishAction',x:740,y:445,w:190,h:40,label:'complete'},
  {id:'transfer',x:740,y:490,w:190,h:40,label:'transfer'},
  {id:'follow',x:740,y:535,w:190,h:40,label:'followUp'},
  {id:'discardAction',x:740,y:580,w:190,h:40,label:'requestDiscard'},
  {id:'extension',x:740,y:625,w:190,h:40,label:'requestExtension'},
  {id:'discard',x:1030,y:500,w:200,h:64,label:'workflowDiscarded',decision:true},
  {id:'discarded',x:1300,y:445,w:190,h:44,label:'statusDiscarded',state:true},
  {id:'finish',x:1030,y:610,w:200,h:64,label:'workflowCompleted',decision:true},
  {id:'deadline',x:420,y:725,w:200,h:64,label:'workflowCheckDeadline',decision:true},
  {id:'nearTimeout',x:740,y:730,w:190,h:44,label:'workflowNearTimeout',state:true},
  {id:'timeout',x:420,y:910,w:200,h:44,label:'overdue',state:true},
  {id:'finishOverdue',x:740,y:895,w:190,h:40,label:'complete'},
  {id:'followOverdue',x:740,y:940,w:190,h:40,label:'followUp'},
  {id:'closure',x:1030,y:880,w:200,h:64,label:'closureType',decision:true},
  {id:'completed',x:1030,y:1060,w:200,h:44,label:'statusCompleted',state:true},
  {id:'reviews',x:1510,y:35,w:190,h:44,label:'issueReviews'},
  {id:'extensionReview',x:1510,y:135,w:190,h:44,label:'extensionReview'},
  {id:'extensionApproved',x:1500,y:250,w:210,h:64,label:'workflowReviewApproved',decision:true},
  {id:'continue',x:1510,y:430,w:190,h:44,label:'workflowRemainInProgress'},
  {id:'closureReview',x:1740,y:885,w:190,h:44,label:'abnormalClosureReview'},
  {id:'closureApproved',x:1730,y:990,w:210,h:64,label:'workflowReviewApproved',decision:true},
  {id:'rejected',x:1970,y:1000,w:120,h:64,label:'workflowRemainInProgress'},
  {id:'end',x:1300,y:1060,w:190,h:44,label:'workflowEnd',terminal:true},
]
const lines = [
  '100,50 100,105','100,145 100,200','100,240 100,295','100,339 100,390','100,454 100,560',
  '190,410 230,355','395,330 460,252','510,274 510,325','620,357 740,357','520,389 520,510',
  '520,554 520,615','620,532 710,532','930,532 1030,532','1230,532 1300,467','930,550 1030,642',
  '520,659 520,725','620,757 740,757','520,789 520,910','620,932 710,932',
  '1130,674 1130,880','1230,912 1740,912','1130,944 1130,1060',
  '1605,79 1605,135','1605,179 1605,250','1605,314 1605,430',
  '1500,282 1490,282 1490,690 590,690 590,659',
  '930,645 980,645 980,157 1510,157',
  '1395,489 1395,710 680,710 680,637 620,637',
  '1835,929 1835,990','1940,1022 1970,1022','1835,1054 1835,1082 1490,1082',
  '1230,1082 1300,1082','1395,710 1395,1060',
]
const branchLabels = [
  {id:'assignedYes',x:100,y:505,label:'yes'}, {id:'assignedNo',x:205,y:390,label:'no'},
  {id:'assignYes',x:415,y:290,label:'yes'}, {id:'claimNo',x:660,y:348,label:'no'},
  {id:'claimYes',x:530,y:450,label:'yes'}, {id:'discardYes',x:1260,y:490,label:'yes'},
  {id:'extensionRequest',x:1120,y:147,label:'requestExtension'},
  {id:'extensionPass',x:1615,y:375,label:'approved'},
  {id:'deadlineWarning',x:650,y:720,label:'workflowWithin24Hours'},
  {id:'deadlineOverdue',x:530,y:850,label:'overdue'},
  {id:'normalClosure',x:1140,y:1000,label:'normalClosure'},
  {id:'rejected',x:1920,y:990,label:'rejected'},
]
</script>
<style scoped>
.workflow-diagram { width:100%; overflow:auto; padding:16px 0 }
svg { display:block; width:100%; min-width:1300px; height:auto }
.node-label { height:100%; display:flex; align-items:center; justify-content:center; text-align:center; overflow-wrap:anywhere; font:15px/1.2 Arial,sans-serif; color:#595959 }
.node-label.state { color:#fff }
</style>
