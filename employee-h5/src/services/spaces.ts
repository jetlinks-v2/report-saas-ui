import type {SharedRecord} from '../types'
import {name} from './labels'

export interface SpaceOption {value:string;label:string;children?:SpaceOption[]}

/** 保留完整空间路径；公区或楼栋也能作为报事位置。 */
export function spaceOptions(rows:SharedRecord[]):SpaceOption[]{
 return rows.map(row=>({value:row.id,label:name(row),...(row.children?.length?{children:spaceOptions(row.children)}:{})}))
}
