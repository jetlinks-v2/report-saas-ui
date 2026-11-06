import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spaceOptions} from '../src/services/spaces'

test('同名房间保留各自区域和楼栋，且公区中间节点可作为位置',()=>{
 const options=spaceOptions([{id:'area',name:'A区',children:[
  {id:'building1',name:'1栋',children:[{id:'room1',name:'101',children:[]}]},
  {id:'building2',displayName:'2栋',children:[{id:'room2',name:'101'}]},
  {id:'garden',name:'花园'}]}])
 assert.deepEqual(options,[{value:'area',label:'A区',children:[
  {value:'building1',label:'1栋',children:[{value:'room1',label:'101'}]},
  {value:'building2',label:'2栋',children:[{value:'room2',label:'101'}]},
  {value:'garden',label:'花园'}]}])
 assert.deepEqual(spaceOptions([]),[])
})
