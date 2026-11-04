import i18n from '@jetlinks-web-core/locales'
import { computed, ref, watch } from 'vue'
import type { SelectOption } from '../types'
const { t } = i18n.global

/** 描述勾选为弹窗草稿，确认后才写入表单；取消保留原始选择。 */
export function useDescriptionPicker(props:{value:string[];options:SelectOption[]},update:(value:string[])=>void) {
  const open=ref(false),draft=ref<string[]>([]),search=ref('')
  const groups=computed(()=>{
    const grouped=new Map<string,SelectOption[]>()
    props.options.filter(row=>row.label.includes(search.value)||row.group?.includes(search.value)).forEach(row=>{
      const name=row.group||t('ReportRepair.issueDescription');grouped.set(name,[...(grouped.get(name)||[]),row])
    })
    return [...grouped].map(([name,items])=>({name,items}))
  })
  watch(()=>props.options,options=>{const ids=new Set(options.map(row=>row.value));draft.value=draft.value.filter(id=>ids.has(id))})
  const show=()=>{draft.value=[...props.value];search.value='';open.value=true}
  const confirm=()=>{update([...draft.value]);open.value=false}
  const cancel=()=>{open.value=false}
  const clear=()=>{draft.value=[]}
  return {open,draft,search,groups,show,confirm,cancel,clear}
}
