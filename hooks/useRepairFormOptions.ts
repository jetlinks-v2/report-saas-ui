import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { queryConfigurations, saveConfiguration } from '../api'
import type { Configuration } from '../types'
import { errorMessage, result } from '../utils'
import { formOptionFields, resolveFormOptions, formOptionsError } from '../services/formOptions'

/** 编辑当前业务项目的独立表单显示设置，切换项目后丢弃旧请求和旧配置ID。 */
export function useRepairFormOptions() {
  const open=ref(false),loading=ref(false),saving=ref(false),error=ref(''),projectId=ref<string>(),loadFailed=ref(false)
  const form=reactive<Configuration>({businessProjectId:'',kind:'intakeOptions',name:'报事表单显示设置',enabled:true,configuration:resolveFormOptions()})
  let revision=0
  const load=async()=>{
    const current=++revision;error.value='';loadFailed.value=false;form.id=undefined;form.businessProjectId=projectId.value||'';form.configuration=resolveFormOptions()
    loading.value=!!projectId.value
    if(!projectId.value)return
    try{const page=result(await queryConfigurations({pageSize:2,terms:[{column:'kind',value:'intakeOptions'},{column:'businessProjectId',value:projectId.value}]}));if(current!==revision)return
      if(page.data[0]){form.id=page.data[0].id;form.configuration=resolveFormOptions(page.data[0].configuration)}
    }catch(e){if(current===revision){error.value=errorMessage(e);loadFailed.value=true}}finally{if(current===revision)loading.value=false}
  }
  watch(projectId,load)
  const edit=(project?:string)=>{open.value=true;if(projectId.value===project)void load();else projectId.value=project}
  const save=async()=>{
    if(!projectId.value){error.value='请选择业务项目';return}
    const invalid=formOptionsError(resolveFormOptions(form.configuration));if(invalid){error.value=invalid;return}
    if(loading.value||loadFailed.value)return
    saving.value=true;error.value=''
    try{result(await saveConfiguration({...form,configuration:resolveFormOptions(form.configuration)}));open.value=false;message.success('表单显示设置已保存')}
    catch(e){error.value=errorMessage(e)}finally{saving.value=false}
  }
  return reactive({open,loading,saving,error,projectId,form,fields:formOptionFields,edit,save})
}
