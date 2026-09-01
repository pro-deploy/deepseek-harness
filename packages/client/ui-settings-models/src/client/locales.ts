/** Copy dictionaries for the Models settings section. */

/** English strings (the key-set source of truth for this pair). */
export const en = {
  nav: 'Models',
  title: 'Models',
  intro: 'Enter your KROKKI token to use the models.',
  cancel: 'Cancel',
  apply: 'Apply',
  applying: 'Applying…',
  readOnly: 'The settings document is read-only in this deployment.',
  loadFailed: 'Loading the provider directory failed',
  retry: 'Retry',
  keyInput: 'Token',
  keyPlaceholder: 'Enter your KROKKI token',
  keyStored: 'Configured — enter a new value to replace',
  keyEnvLocked: 'Provided by the launch environment (read-only)',
  keyBlank: 'Enter the token, or leave the field empty to keep the stored one.',
  keyIllegalCharacters: 'This token is not in a valid format. Please check it.',
  keyRequired: 'Enter your token to continue.',
  welcomeTitle: 'Internal Testing Notice',
  welcomeBody: "DeepSeek Harness 0.1 remains in testing for Harness developers. Many areas need further improvement, and we welcome feedback from the developer community. DeepSeek Harness's core plugins and foundational APIs will continue to evolve rapidly over the coming months.\n\nWe look forward to exploring the limits of intelligence with developers around the world, building on open-source, open, reusable, and composable infrastructure. We welcome Harness developers everywhere to join the DSH plugin ecosystem.",
  welcomeContinue: 'Continue',
  welcomeError: 'The acknowledgement could not be saved. Please try again.',
  onboardingTitle: 'Enter your KROKKI token to get started',
  onboardingDescription: 'Enter your KROKKI token to start building.',
  onboardingLater: 'Configure later',
  onboardingSave: 'Save and continue',
  onboardingSaving: 'Saving…',
}

/** The settings.models namespace key union. */
export type ModelsKey = keyof typeof en

/** Chinese strings (same keys as {@link en}). */
export const zh: { [Key in keyof typeof en]: string } = {
  nav: '模型',
  title: '模型',
  intro: '填入你的 KROKKI 令牌即可使用模型。',
  cancel: '取消',
  apply: '保存',
  applying: '保存中…',
  readOnly: '当前部署的设置文档为只读。',
  loadFailed: '加载提供方目录失败',
  retry: '重试',
  keyInput: '令牌',
  keyPlaceholder: '输入你的 KROKKI 令牌',
  keyStored: '已配置——输入新值可替换',
  keyEnvLocked: '由启动环境提供（只读）',
  keyBlank: '请输入令牌；留空则保持已存储的令牌。',
  keyIllegalCharacters: '该令牌格式错误，请检查。',
  keyRequired: '请输入令牌后继续。',
  welcomeTitle: '内测声明',
  welcomeBody: 'DeepSeek Harness 目前的 0.1 版本仍处在面向 Harness 开发者进行测试的阶段，还有许多地方需要持续改进和打磨，希望听取广大开发者的反馈建议。预计 DeepSeek Harness 的核心插件以及基础 API 都会在接下来的一段时间内快速迭代、持续演化。\n\n我们期待与全球开发者一起，在开源、开放、可复用、可组合的基础设施之上，共同探索智能上限。欢迎全球 Harness 开发者加入 DSH 插件生态。',
  welcomeContinue: '继续',
  welcomeError: '暂时无法保存确认状态，请重试。',
  onboardingTitle: '输入你的 KROKKI 令牌开始使用',
  onboardingDescription: '输入你的 KROKKI 令牌，即可开始使用。',
  onboardingLater: '稍后配置',
  onboardingSave: '保存并继续',
  onboardingSaving: '保存中…',
}
