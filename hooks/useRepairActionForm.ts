import i18n from '@jetlinks-web-core/locales'
import { computed, ref } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { ActionInput, Order } from '../types'
import { actionContent } from '../services/actions'
const { t } = i18n.global

/** 每个旧处理表单的校验归属；弹窗确定必须等待 Form 验证，不以红色星号代替校验。 */
export function useRepairActionForm(props: { action: string; order: Order; form: ActionInput; options: { readOnly: boolean } }) {
  const formRef = ref<FormInstance>()
  const content = computed(() => actionContent(props.action, props.order.status === 7))
  const showContent = computed(() => !['accept', 'grab', 'toPaid', 'sign', 'changeCategory', 'changeLevel', 'delay', 'abandonApply'].includes(props.action))
  const reasonLimit = computed(() => ['delay', 'review'].includes(props.action) ? 800 : 200)
  const rules = computed(() => {
    const rules: Record<string, Rule[]> = {}
    const required = (name: string, message: string) => { rules[name] = [{ required: true, whitespace: true, message }] }
    if (showContent.value) rules.description = [{ required: content.value.required, whitespace: content.value.required, max: content.value.max, message: content.value.required ? t('ReportRepair.enterUpToCharacters', { p0: content.value.label, p1: content.value.max }) : t('ReportRepair.upToCharacters', { p0: content.value.max }) }]
    if (['dispatch', 'transfer'].includes(props.action)) required('assignedUserId', t('ReportRepair.selectAnAssignee'))
    if ((props.action === 'follow' && props.order.status === 7) || props.action === 'changeLevel') required('levelId', t('ReportRepair.selectAnIssuePriority'))
    if (props.action === 'follow' && props.order.status === 7) rules.attachmentIds = [{ required: true, validator: async () => {
      if (!props.form.attachmentIds?.length) throw new Error(t('ReportRepair.uploadArrivalPhotosForTheFirstFollowUp'))
    } }]
    if (props.action === 'changeCategory') {
      required('categoryId', t('ReportRepair.selectAThirdLevelIssueCategory'))
      rules.labelIds = [{ required: true, type: 'array', min: 1, message: t('ReportRepair.selectIssueTags') }]
    }
    if (['finish', 'quote', 'close'].includes(props.action) && !props.options.readOnly) required('replyId', t('ReportRepair.selectAReply'))
    if (['delay', 'abandonApply'].includes(props.action) || (props.action === 'review' && !props.form.approved)) required('reason', t('ReportRepair.enterAReason'))
    if (props.action === 'delay') rules.delayUntil = [{ required: true, type: 'number', message: t('ReportRepair.selectAnExtendedDeadline') }, { validator: async (_, value) => {
      if (value && props.order.finishDeadline && value <= props.order.finishDeadline) throw new Error(t('ReportRepair.theExtendedDeadlineMustBeLaterThanTheOriginal'))
    } }]
    if (['callback', 'evaluate', 'ownerEvaluate'].includes(props.action)) required('satisfactionId', t('ReportRepair.selectSatisfaction'))
    if (props.action === 'callback') {
      required('callbackMethod', t('ReportRepair.selectAFollowUpVisitMethod')); required('callbackResult', t('ReportRepair.selectAFollowUpVisitResult')); required('callbackPerson', t('ReportRepair.enterTheFollowUpVisitorName'))
      rules.callbackTime = [{ required: true, type: 'number', message: t('ReportRepair.selectAFollowUpVisitTime') }]
      rules.rework = [{ required: true, type: 'boolean', message: t('ReportRepair.selectWhetherTheFollowUpVisitPassed') }]
    }
    if (props.action === 'review') {
      required('reviewId', t('ReportRepair.selectAReviewRequest')); rules.approved = [{ required: true, type: 'boolean', message: t('ReportRepair.selectAReviewResult') }]
    }
    if (props.action === 'quote') for (const name of ['materialAmount', 'artificialAmount']) rules[name] = [{ required: true, type: 'number', min: 0, message: t('ReportRepair.enterANonNegativeCost') }]
    if (['sign', 'ownerEvaluate'].includes(props.action)) {
      required('ownerName', t('ReportRepair.enterTheOwnerName')); required('ownerPhone', t('ReportRepair.enterTheOwnerContactInformation'))
      if (props.action === 'sign') required('signatureFileId', t('ReportRepair.uploadTheOwnerSignatureImage'))
    }
    return rules
  })
  const validate = async () => { await formRef.value?.validate() }
  const clearValidate = () => formRef.value?.clearValidate()
  return { formRef, rules, content, showContent, reasonLimit, validate, clearValidate }
}
