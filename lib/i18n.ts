import { useApp } from '@/app/context'

const STRINGS = {
  en: {
    // Sidebar (already in sidebar.tsx — kept here for reference only)
    // Domain names (overrides DOMAINS[x].name when zh-TW)
    domainName: { japanese: 'Nihongo', english: 'English', french: 'Français', math: 'Math' },
    // Math level mode toggle
    mathMode: { topic: 'Topic', tier: 'Tier', combined: 'Combined' },
    // Math level labels per mode
    mathTopic:    ['Arithmetic','Algebra','Geometry','Trigonometry','Calculus','Statistics'],
    mathTier:     ['Foundational','Elementary','Intermediate','Advanced','University'],
    mathCombined: ['Arithmetic I','Arithmetic II','Algebra I','Algebra II','Geometry','Calculus I','Calculus II','Statistics'],
    // Lessons page
    lessonsHeading: 'Lessons',
    noLessons: 'No lessons at this level yet.',
    // Lesson viewer — shared
    chapter:   'Chapter',
    startQuiz: 'Start quiz',
    questionsHint: (n: number) => `${n} question${n !== 1 ? 's' : ''} — test your understanding.`,
    // Lesson viewer — math tabs
    tabContent:   'Content',
    tabConcepts:  'Concepts',
    tabExamples:  'Examples',
    tabQuiz:      'Quiz',
    // Worked examples
    problem: 'Problem',
    answer:  'Answer',
    // Admin page
    adminHeading:     'Admin — Generate Lesson',
    adminNewLesson:   'New lesson',
    adminLevel:       'Level',
    adminChapter:     'Chapter',
    adminTopic:       'Topic',
    adminPlaceholderJp:   'e.g. Greetings',
    adminPlaceholderMath: 'e.g. Quadratic equations',
    adminPlaceholderOther:'e.g. Present perfect',
    adminTopicRequired:   'Topic is required',
    adminGenerating:      'Generating (~20s)…',
    adminGenerate:        'Generate',
    adminCreated:         '✓ Lesson created:',
    adminOpen:            'Open lesson →',
    adminGenerateFailed:  'Generation failed',
    adminNetworkError:    'Network error',
    translating:          'Generating Chinese translation…',
    translateError:       'Failed to generate Chinese translation.',
    translateRetry:       'Retry',
    // Commands
    navCommands:          'Commands',
    commandsHeading:      'Commands',
    newCommand:           'New command',
    commandName:          'Command name',
    commandNameHint:      'No slash needed — it will be added automatically',
    commandDescription:   'Description',
    commandDescHint:      'Describe what this command should do in plain language',
    commandPromptLabel:   'AI prompt',
    commandSave:          'Save & Generate',
    commandUpdate:        'Save & Regenerate',
    commandGenerating:    'Generating…',
    commandDelete:        'Delete',
    commandDeleteConfirm: 'Delete this command?',
    commandNameRequired:  'Command name is required',
    commandDescRequired:  'Description is required',
    commandNetworkError:  'Network error',
    noCommands:           'No commands yet. Create one to get started.',
  },
  'zh-TW': {
    domainName: { japanese: 'Nihongo', english: 'English', french: 'Français', math: '數學' },
    mathMode: { topic: '主題', tier: '階段', combined: '混合' },
    mathTopic:    ['算術','代數','幾何','三角學','微積分','統計學'],
    mathTier:     ['基礎','初級','中級','進階','大學'],
    mathCombined: ['算術一','算術二','代數一','代數二','幾何','微積分一','微積分二','統計學'],
    lessonsHeading: '課程',
    noLessons: '此級別尚無課程。',
    chapter:   '第',
    startQuiz: '開始測驗',
    questionsHint: (n: number) => `${n} 道題目 — 測試你的理解。`,
    tabContent:   '內容',
    tabConcepts:  '概念',
    tabExamples:  '例題',
    tabQuiz:      '測驗',
    problem: '題目',
    answer:  '答案',
    // Admin page
    adminHeading:     '管理 — 製作課程',
    adminNewLesson:   '新課程',
    adminLevel:       '級別',
    adminChapter:     '章節',
    adminTopic:       '主題',
    adminPlaceholderJp:   '例：問候語',
    adminPlaceholderMath: '例：二次方程式',
    adminPlaceholderOther:'例：現在完成式',
    adminTopicRequired:   '主題為必填',
    adminGenerating:      '製作中（約20秒）…',
    adminGenerate:        '製作',
    adminCreated:         '✓ 課程已製作：',
    adminOpen:            '開啟課程 →',
    adminGenerateFailed:  '製作失敗',
    adminNetworkError:    '網絡錯誤',
    translating:          '正在生成中文翻譯…',
    translateError:       '生成中文翻譯失敗。',
    translateRetry:       '重試',
    // Commands
    navCommands:          '指令',
    commandsHeading:      '指令',
    newCommand:           '新增指令',
    commandName:          '指令名稱',
    commandNameHint:      '不需要加斜線，系統會自動補上',
    commandDescription:   '描述',
    commandDescHint:      '用白話文描述這個指令應該做什麼',
    commandPromptLabel:   'AI 提示詞',
    commandSave:          '儲存並生成',
    commandUpdate:        '儲存並重新生成',
    commandGenerating:    '生成中…',
    commandDelete:        '刪除',
    commandDeleteConfirm: '確定刪除此指令？',
    commandNameRequired:  '指令名稱為必填',
    commandDescRequired:  '描述為必填',
    commandNetworkError:  '網絡錯誤',
    noCommands:           '尚無指令。建立一個開始使用。',
  },
} as const

export type I18n = typeof STRINGS.en

export function useT(): I18n {
  const { uiLang } = useApp()
  return STRINGS[uiLang] as I18n
}

/** Translate math level labels for getDomainLevels results */
export function translateMathLabels(
  mode: 'topic' | 'tier' | 'combined',
  t: I18n,
): string[] {
  if (mode === 'topic')    return [...t.mathTopic]
  if (mode === 'tier')     return [...t.mathTier]
  return [...t.mathCombined]
}
