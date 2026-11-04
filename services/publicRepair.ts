import type { PublicForm, PublicSpace } from '../api/public'
import type { CategoryOption } from '../types'

/** 空间区域筛选仅影响展示；提交范围仍由后端重新校验。 */
export function publicSpaceTree(form:PublicForm,area?:number):CategoryOption[] {
  const byId=new Map(form.spaces.map(space=>[space.id,space]))
  const inArea=(space:PublicSpace)=>{
    if(!form.enableCampus||area===undefined)return true
    const roots=form.campusOptions[area]?.spaceRootIds||[]
    let current:PublicSpace|undefined=space
    for(let depth=0;current&&depth<64;depth++){
      if(roots.includes(current.id))return true
      current=byId.get(current.parentId)
    }
    return false
  }
  const rows=form.spaces.filter(inArea),ids=new Set(rows.map(row=>row.id))
  const build=(parentId?:string,ancestors=new Set<string>()):CategoryOption[]=>rows
    .filter(row=>parentId?row.parentId===parentId:!ids.has(row.parentId))
    .filter(row=>!ancestors.has(row.id)).map(row=>{
      const children=build(row.id,new Set([...ancestors,row.id]))
      return {value:row.id,label:row.name,disabled:!row.selectable,...children.length?{children}:{}}
    })
  return build()
}
