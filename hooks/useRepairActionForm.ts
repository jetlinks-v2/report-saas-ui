import { computed, ref } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { ActionInput, Order } from '../types'
import { actionContent } from '../services/actions'

/** 每个旧处理表单的校验归属；弹窗确定必须等待 Form 验证，不以红色星号代替校验。 */
export function useRepairActionForm(props: { action: string; order: Order; form: ActionInput; options: { readOnly: boolean } }) {
  const formRef = ref<FormInstance>()
  const content = computed(() => actionContent(props.action, props.order.status === 7))
  const showContent = computed(() => !['accept', 'grab', 'toPaid', 'sign', 'changeCategory', 'changeLevel', 'delay', 'abandonApply'].includes(props.action))
  const reasonLimit = computed(() => ['delay', 'review'].includes(props.action) ? 800 : 200)
  const rules = computed(() => {
    const rules: Record<string, Rule[]> = {}
    const required = (name: string, message: string) => { rules[name] = [{ required: true, whitespace: true, message }] }
    if (showContent.value) rules.description = [{ required: content.value.required, whitespace: content.value.required, max: content.value.max, message: content.value.required ? `请填写${content.value.label}（最多${content.value.max}字）` : `最多${content.value.max}字` }]
    if (['dispatch', 'transfer'].includes(props.action)) required('assignedUserId', '请选择责任人')
    if ((props.action === 'follow' && props.order.status === 7) || props.action === 'changeLevel') required('levelId', '请选择报事等级')
    if (props.action === 'follow' && props.order.status === 7) rules.attachmentIds = [{ required: true, validator: async () => {
      if (!props.form.attachmentIds?.length) throw new Error('首次跟进请上传到场照片')
    } }]
    if (props.action === 'changeCategory') {
      required('categoryId', '请选择第三级报事分类')
      rules.labelIds = [{ required: true, type: 'array', min: 1, message: '请选择报事标签' }]
    }
    if (['finish', 'quote', 'close'].includes(props.action) && !props.options.readOnly) required('replyId', '请选择回复语')
    if (['delay', 'abandonApply'].includes(props.action) || (props.action === 'review' && !props.form.approved)) required('reason', '请填写原因')
    if (props.action === 'delay') rules.delayUntil = [{ required: true, type: 'number', message: '请选择延期时间' }, { validator: async (_, value) => {
      if (value && props.order.finishDeadline && value <= props.order.finishDeadline) throw new Error('延期时间须晚于原完成时限')
    } }]
    if (['callback', 'evaluate', 'ownerEvaluate'].includes(props.action)) required('satisfactionId', '请选择满意度')
    if (props.action === 'callback') {
      required('callbackMethod', '请选择回访方式'); required('callbackResult', '请选择回访结果'); required('callbackPerson', '请输入回访人')
      rules.callbackTime = [{ required: true, type: 'number', message: '请选择回访时间' }]
      rules.rework = [{ required: true, type: 'boolean', message: '请选择回访是否通过' }]
    }
    if (props.action === 'review') {
      required('reviewId', '请选择审核申请'); rules.approved = [{ required: true, type: 'boolean', message: '请选择审核结果' }]
    }
    if (props.action === 'quote') for (const name of ['materialAmount', 'artificialAmount']) rules[name] = [{ required: true, type: 'number', min: 0, message: '请输入非负费用' }]
    if (['sign', 'ownerEvaluate'].includes(props.action)) {
      required('ownerName', '请输入业主姓名'); required('ownerPhone', '请输入业主联系方式')
      if (props.action === 'sign') required('signatureFileId', '请上传业主签字图片')
    }
    return rules
  })
  const validate = async () => { await formRef.value?.validate() }
  const clearValidate = () => formRef.value?.clearValidate()
  return { formRef, rules, content, showContent, reasonLimit, validate, clearValidate }
}
