import i18n from '@jetlinks-web-core/locales'
import { ref, watch, type Ref } from 'vue'
import type { UploadChangeParam, UploadFile } from 'ant-design-vue'
import { getImageUrl } from '@jetlinks-web-core/utils'
const { t } = i18n.global

type ResponseFile = UploadFile<{ success?: boolean; status?: number; result?: { id?: string; accessUrl?: string } }>
/** 共享 FileUpload 的 value 为单文件 ID，多附件通过完整上传列表汇总，不覆盖其他正在上传的文件。 */
export function useAttachments(ids: Ref<string[]>, update: (ids: string[]) => void, busy: (value: boolean) => void) {
  const files = ref<ResponseFile[]>([])
  const fileId = (file: ResponseFile) => file.response?.result?.id || (!file.originFileObj ? file.uid : undefined)
  watch(ids, values => {
    const current = files.value.filter(file => file.status === 'done').map(fileId).filter(Boolean)
    if (JSON.stringify(current) === JSON.stringify(values)) return
    files.value = values.map(id => files.value.find(file => fileId(file) === id) || { uid: id, name: t('ReportRepair.issueAttachments'), status: 'done', url: getImageUrl(id) })
  }, { immediate: true })
  const change = (info: UploadChangeParam<ResponseFile>) => {
    files.value = info.fileList
    busy(info.fileList.some(file => file.status === 'uploading'))
    update(info.fileList.filter(file => file.status === 'done' && (!file.response || file.response.status === 200 || file.response.success))
      .map(fileId).filter((id): id is string => !!id))
  }
  return { files, change }
}
