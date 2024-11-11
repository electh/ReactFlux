export const validateAndFormatFormFields = (form) => {
  // 获取当前表单所有字段的值
  const allFields = form.getFieldsValue()
  let isFormValid = true

  // 遍历所有字段，去除非密码字段的前后空格，并检查是否所有必填字段都已填写
  for (const [key, value] of Object.entries(allFields)) {
    if (key !== "password") {
      const trimmedValue = value?.trim()
      form.setFieldValue(key, trimmedValue) // 更新去除空格后的值
      if (!trimmedValue) {
        isFormValid = false // 如果去除空格后的必填字段为空，则表单不有效
      }
    } else if (!value) {
      isFormValid = false // 如果密码字段为空，则表单不有效
    }
  }

  return isFormValid
}

export const handleEnterKeyToSubmit = (event, form) => {
  if (event.key === "Enter") {
    form.submit()
  }
}
