import { reactive, ref } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { deleteConfiguration, queryConfigurations, saveConfiguration } from '../api'
import type { Configuration } from '../types'
import { errorMessage, result } from '../utils'

/** 标签详情独立分页与编辑，打开或关闭抽屉不替换主标签列表及其筛选。 */
export function useDescriptionConfiguration() {
  const parent=ref<Configuration>(),rows=ref<Configuration[]>([]),loading=ref(false),saving=ref(false),error=ref(''),editing=ref(false)
  const current=ref(1),pageSize=ref(10),total=ref(0),formRef=ref<FormInstance>()
  const form=reactive<Configuration>({businessProjectId:'',kind:'description',name:'',enabled:true,sortIndex:0,configuration:{content:''}})
  let sequence=0
  const load=async()=>{
    const request=++sequence,label=parent.value
    if(!label)return
    loading.value=true;error.value=''
    try{
      const data=result(await queryConfigurations({pageIndex:current.value-1,pageSize:pageSize.value,terms:[{column:'kind',value:'description'},{column:'businessProjectId',value:label.businessProjectId},{column:'parentId',value:label.id}],sorts:[{name:'sortIndex',order:'asc'},{name:'id',order:'asc'}]}))
      if(request===sequence){rows.value=data.data;total.value=data.total}
    }catch(e){if(request===sequence)error.value=errorMessage(e)}finally{if(request===sequence)loading.value=false}
  }
  const show=(row:Configuration)=>{parent.value=row;rows.value=[];total.value=0;current.value=1;void load()}
  const close=()=>{++sequence;parent.value=undefined;rows.value=[];editing.value=false;loading.value=false;error.value=''}
  const edit=(row?:Configuration)=>{
    if(!parent.value)return
    Object.assign(form,{id:undefined,businessProjectId:parent.value.businessProjectId,parentId:parent.value.id,kind:'description',name:'',enabled:true,sortIndex:0,configuration:{content:''}},row?JSON.parse(JSON.stringify(row)):{})
    form.configuration.content ??= row?.name||''
    error.value='';editing.value=true;formRef.value?.clearValidate()
  }
  const save=async()=>{
    try{await formRef.value?.validate()}catch{return}
    saving.value=true;error.value=''
    try{result(await saveConfiguration({...form,name:(form.configuration.content||'').slice(0,128)}));editing.value=false;await load();message.success('已保存')}
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  const toggle=async(row:Configuration)=>{
    saving.value=true;error.value=''
    try{result(await saveConfiguration({...row,enabled:!row.enabled}));await load()}
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  const remove=async(row:Configuration)=>{
    if(!row.id)return
    saving.value=true;error.value=''
    try{result(await deleteConfiguration(row.id));await load()}
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  const pageChange=(page:{current?:number;pageSize?:number})=>{current.value=page.current||1;pageSize.value=page.pageSize||10;void load()}
  return reactive({parent,rows,loading,saving,error,editing,current,pageSize,total,formRef,form,show,close,edit,save,toggle,remove,pageChange,load})
}
