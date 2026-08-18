import { CandidateInfo, ReadingGroup, MatchingPair, MultipleChoiceQuestion } from '../types';

export const INITIAL_CANDIDATE: CandidateInfo = {
  nameEn: 'Jovan Ng',
  nameZh: '伍博睿',
  age: 6,
  schoolTarget: 'MKCSCC 廣東話中級班入學模擬測驗',
  totalTimeMinutes: 60,
  testDate: new Date().toISOString().split('T')[0],
};

// Part 1 Speaking Questions
export const SPEAKING_PART_1_QUESTIONS = [
  {
    id: 'sp1_q1',
    title: '問題一：自我介紹',
    promptCantonese: '你叫咩名？今年幾多歲？',
    jyutping: 'nei5 giu3 me1 meng2? gam1 nin4 gei2 do1 seoi3?',
    expectedAnswer: '我叫 Jovan（伍博睿），我今年六歲。',
    expectedJyutping: 'ngo5 giu3 Jovan (ng5 bok3 seoi6), ngo5 gam1 nin4 luk6 seoi3.',
    tips: '要求：能用完整廣東話句子回答姓名與年齡。',
    icon: '👋',
  },
  {
    id: 'sp1_q2',
    title: '問題二：家庭成員',
    promptCantonese: '你屋企有幾多人？佢哋係邊個？',
    jyutping: 'nei5 uk1 kei2 jau5 gei2 do1 jan4? keoi5 dei6 hai6 bin1 go3?',
    expectedAnswer: '我屋企有四個人，有爸爸、媽媽、我同妹妹。',
    expectedJyutping: 'ngo5 uk1 kei2 jau5 sei3 go3 jan4, jau5 baa4 baa1, maa4 maa1, ngo5 tung4 mui4 mui2.',
    tips: '要求：說出人數並列舉成員稱謂。',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'sp1_q3',
    title: '問題三：個人喜好',
    promptCantonese: '你平時最鍾意食咩／玩咩？',
    jyutping: 'nei5 ping4 si4 zeoi3 zung1 ji3 sik6 me1 / waan2 me1?',
    expectedAnswer: '我最鍾意食雪糕／生果……或者我最鍾意玩積木／車仔……',
    expectedJyutping: 'ngo5 zeoi3 zung1 ji3 sik6... / ngo5 zeoi3 zung1 ji3 waan2...',
    tips: '要求：能用「我最鍾意……」句式清晰表達食物或玩具。',
    icon: '🍦',
  },
  {
    id: 'sp1_q4',
    title: '問題四：日常觀察與天氣',
    promptCantonese: '今日天氣點樣？',
    jyutping: 'gam1 jat6 tin1 hei3 dim2 joeng2?',
    expectedAnswer: '今日好天／落雨／出太陽／好熱／好凍。',
    expectedJyutping: 'gam1 jat6 hou2 tin1 / lok6 jyu5 / ceot1 taai3 joeng4 / hou2 jit6.',
    tips: '要求：觀察當天天氣情況並用合適廣東話詞彙描述。',
    icon: '☀️',
  },
];

// Part 1 Section 2: Look at Pictures & Identify
export const BODY_PARTS_ITEMS = [
  { id: 'bp_head', name: '頭', jyutping: 'tau4', emoji: '👦', desc: '頭部' },
  { id: 'bp_eye', name: '眼', jyutping: 'ngaan5', emoji: '👁️', desc: '眼睛' },
  { id: 'bp_ear', name: '耳仔', jyutping: 'ji5 zai2', emoji: '👂', desc: '耳朵' },
  { id: 'bp_nose', name: '鼻', jyutping: 'bei6', emoji: '👃', desc: '鼻子' },
  { id: 'bp_mouth', name: '口', jyutping: 'hau2', emoji: '👄', desc: '嘴巴/口' },
  { id: 'bp_hand', name: '手', jyutping: 'sau2', emoji: '✋', desc: '手臂/手掌' },
  { id: 'bp_foot', name: '腳', jyutping: 'goek3', emoji: '🦶', desc: '雙腳/腿' },
];

export const STATIONERY_COLOR_ITEMS = [
  { id: 'sc_red_pen', item: '鉛筆', color: '紅色', colorHex: '#EF4444', itemJyutping: 'jyun4 bat1', colorJyutping: 'hung4 sik1', icon: '✏️' },
  { id: 'sc_blue_ruler', item: '尺', color: '藍色', colorHex: '#3B82F6', itemJyutping: 'cek3', colorJyutping: 'laam4 sik1', icon: '📏' },
  { id: 'sc_yellow_bag', item: '書包', color: '黃色', colorHex: '#EAB308', itemJyutping: 'syu1 baau1', colorJyutping: 'wong4 sik1', icon: '🎒' },
  { id: 'sc_green_scissors', item: '剪刀', color: '綠色', colorHex: '#22C55E', itemJyutping: 'zin2 dou1', colorJyutping: 'luk6 sik1', icon: '✂️' },
  { id: 'sc_black_pen', item: '筆', color: '黑色', colorHex: '#1F2937', itemJyutping: 'bat1', colorJyutping: 'haak1 sik1', icon: '🖊️' },
  { id: 'sc_white_paper', item: '紙', color: '白色', colorHex: '#F3F4F6', itemJyutping: 'zi2', colorJyutping: 'baak6 sik1', icon: '📄' },
];

export const SCENARIO_ITEMS = [
  {
    id: 'sc_run',
    actionName: '跑緊步',
    jyutping: 'paau2 gan2 bou6',
    scene: '公園玩耍',
    question: '張圖入面個小朋友做緊咩呀？',
    expected: '佢喺度跑緊步。',
    emoji: '🏃‍♂️',
    desc: '小朋友在草地上奔跑運動',
  },
  {
    id: 'sc_read',
    actionName: '睇緊書',
    jyutping: 'tai2 gan2 syu1',
    scene: '學校上堂',
    question: '張圖入面個小朋友做緊咩呀？',
    expected: '佢喺度睇緊書。',
    emoji: '📖',
    desc: '小朋友坐在書桌前認真看書',
  },
  {
    id: 'sc_draw',
    actionName: '畫緊畫',
    jyutping: 'waa2 gan2 waa2',
    scene: '美術課堂',
    question: '張圖入面個小朋友做緊咩呀？',
    expected: '佢喺度畫緊畫。',
    emoji: '🎨',
    desc: '小朋友拿著畫筆在畫紙上繪畫',
  },
  {
    id: 'sc_eat',
    actionName: '食緊嘢',
    jyutping: 'sik6 gan2 je5',
    scene: '茶點時間',
    question: '張圖入面個小朋友做緊咩呀？',
    expected: '佢喺度食緊嘢／食緊生果。',
    emoji: '🍎',
    desc: '小朋友在享用點心美食',
  },
];

// Part 1 Section 3: Listening Comprehension & Oral Commands
export const LISTENING_COMMANDS = [
  {
    id: 'cmd_1',
    number: '1',
    command: '請指住你隻左耳仔。',
    jyutping: 'ceng2 zi2 zyu6 nei5 zek3 zo2 ji5 zai2.',
    actionRequired: '考生用手準確指向自己的左邊耳朵。',
    icon: '👂',
    keyTarget: '左耳仔 (Left Ear)',
  },
  {
    id: 'cmd_2',
    number: '2',
    command: '請攞起張紙上面支紅色筆。',
    jyutping: 'ceng2 lo2 hei2 zoeng1 zi2 soeng6 min6 zi1 hung4 sik1 bat1.',
    actionRequired: '考生辨認出紅色筆並用手將其拿起來。',
    icon: '🖍️',
    keyTarget: '紅色筆 (Red Pen)',
  },
  {
    id: 'cmd_3',
    number: '3',
    command: '請企起身，然後坐返低。',
    jyutping: 'ceng2 kei5 hei2 san1, jin4 hau6 co5 faan1 dai1.',
    actionRequired: '考生聽到指令後站立，隨後安靜坐回椅子上。',
    icon: '🪑',
    keyTarget: '企起身 ➔ 坐返低 (Stand Up & Sit Down)',
  },
];

// Part 2 Section 1: Oral Reading Groups (認讀單字與詞語)
export const READING_GROUPS: ReadingGroup[] = [
  {
    id: 1,
    title: '第一組：基礎數字（1-10）',
    words: [
      { char: '一', jyutping: 'jat1' },
      { char: '二', jyutping: 'ji6' },
      { char: '三', jyutping: 'saam1' },
      { char: '四', jyutping: 'sei3' },
      { char: '五', jyutping: 'ng5' },
      { char: '六', jyutping: 'luk6' },
      { char: '七', jyutping: 'cat1' },
      { char: '八', jyutping: 'baat3' },
      { char: '九', jyutping: 'gau2' },
      { char: '十', jyutping: 'sap6' },
    ],
  },
  {
    id: 2,
    title: '第二組：身體與五官字',
    words: [
      { char: '人', jyutping: 'jan4', meaning: '人' },
      { char: '口', jyutping: 'hau2', meaning: '嘴巴' },
      { char: '手', jyutping: 'sau2', meaning: '手掌' },
      { char: '足', jyutping: 'zuk1', meaning: '腳足' },
      { char: '耳', jyutping: 'ji5', meaning: '耳朵' },
      { char: '目', jyutping: 'muk6', meaning: '眼睛' },
    ],
  },
  {
    id: 3,
    title: '第三組：自然與天地元素',
    words: [
      { char: '日', jyutping: 'jat6', meaning: '太陽' },
      { char: '月', jyutping: 'jyut6', meaning: '月亮' },
      { char: '水', jyutping: 'seoi2', meaning: '清水' },
      { char: '火', jyutping: 'fo2', meaning: '火焰' },
      { char: '山', jyutping: 'saan1', meaning: '山嶺' },
      { char: '石', jyutping: 'sek6', meaning: '石頭' },
      { char: '田', jyutping: 'tin4', meaning: '農田' },
      { char: '土', jyutping: 'tou2', meaning: '泥土' },
    ],
  },
  {
    id: 4,
    title: '第四組：大小多少與方位',
    words: [
      { char: '大', jyutping: 'daai6' },
      { char: '小', jyutping: 'siu2' },
      { char: '多', jyutping: 'do1' },
      { char: '少', jyutping: 'siu2' },
      { char: '上', jyutping: 'soeng6' },
      { char: '下', jyutping: 'haa6' },
      { char: '左', jyutping: 'zo2' },
      { char: '右', jyutping: 'jau6' },
    ],
  },
  {
    id: 5,
    title: '第五組：家庭成員稱謂',
    words: [
      { char: '爸爸', jyutping: 'baa4 baa1' },
      { char: '媽媽', jyutping: 'maa4 maa1' },
      { char: '哥哥', jyutping: 'go1 go1' },
      { char: '姐姐', jyutping: 'ze4 ze1' },
      { char: '弟弟', jyutping: 'dai6 dai6' },
      { char: '妹妹', jyutping: 'mui4 mui2' },
    ],
  },
  {
    id: 6,
    title: '第六組：自然天氣與天空',
    words: [
      { char: '太陽', jyutping: 'taai3 joeng4' },
      { char: '月亮', jyutping: 'jyut6 loeng6' },
      { char: '落雨', jyutping: 'lok6 jyu5' },
      { char: '白雲', jyutping: 'baak6 wan4' },
    ],
  },
];

// Part 2 Section 2: Matching Pairs
export const ANTONYM_MATCHING_PAIRS: MatchingPair[] = [
  { id: 'ant_1', left: '大', right: '小', leftJyutping: 'daai6', rightJyutping: 'siu2' },
  { id: 'ant_2', left: '多', right: '少', leftJyutping: 'do1', rightJyutping: 'siu2' },
  { id: 'ant_3', left: '上', right: '下', leftJyutping: 'soeng6', rightJyutping: 'haa6' },
  { id: 'ant_4', left: '左', right: '右', leftJyutping: 'zo2', rightJyutping: 'jau6' },
];

export const PICTURE_MATCHING_PAIRS: MatchingPair[] = [
  { id: 'pic_1', left: '眼睛', right: '👁️ 眼睛圖片', leftJyutping: 'ngaan5 zing1', rightIcon: '👁️' },
  { id: 'pic_2', left: '鼻子', right: '👃 鼻子圖片', leftJyutping: 'bei6 zi2', rightIcon: '👃' },
  { id: 'pic_3', left: '嘴巴', right: '👄 嘴巴圖片', leftJyutping: 'zeoi2 baa1', rightIcon: '👄' },
  { id: 'pic_4', left: '耳朵', right: '👂 耳朵圖片', leftJyutping: 'ji5 do2', rightIcon: '👂' },
];

// Part 2 Section 3: Multiple Choice & Quantifiers
export const MULTIPLE_CHOICE_QUESTIONS: MultipleChoiceQuestion[] = [
  {
    id: 'mc_1',
    question: '一（ ）書',
    jyutping: 'jat1 ( ) syu1',
    options: [
      { label: 'A', text: '隻' },
      { label: 'B', text: '本' },
      { label: 'C', text: '支' },
    ],
    correctAnswer: 'B',
    explanation: '書本嘅量詞係「本」，所以係「一本書」。',
  },
  {
    id: 'mc_2',
    question: '兩（ ）鉛筆',
    jyutping: 'loeng5 ( ) jyun4 bat1',
    options: [
      { label: 'A', text: '支' },
      { label: 'B', text: '個' },
      { label: 'C', text: '本' },
    ],
    correctAnswer: 'A',
    explanation: '筆類、細長物體嘅量詞係「支」，所以係「兩支鉛筆」。',
  },
  {
    id: 'mc_3',
    question: '三（ ）小鳥',
    jyutping: 'saam1 ( ) siu2 niu5',
    options: [
      { label: 'A', text: '條' },
      { label: 'B', text: '隻' },
      { label: 'C', text: '張' },
    ],
    correctAnswer: 'B',
    explanation: '禽鳥、動物嘅量詞通常用「隻」，所以係「三隻小鳥」。',
  },
  {
    id: 'mc_4',
    question: '天上有白（ ）。',
    jyutping: 'tin1 soeng6 jau5 baak6 ( ).',
    options: [
      { label: 'A', text: '雨' },
      { label: 'B', text: '風' },
      { label: 'C', text: '雲' },
    ],
    correctAnswer: 'C',
    explanation: '天空中飄浮嘅白色物體係「白雲」。',
  },
];

// Part 2 Section 4: Writing Questions & Dictation
export const WRITING_QUESTIONS = {
  section1_look_write: [
    {
      id: 'wq_apples',
      prompt: '看到 3 個蘋果 🍎🍎🍎，寫出中文字：',
      imageDesc: '3 個紅蘋果',
      correctChar: '三',
      jyutping: 'saam1',
      strokeCount: 3,
      strokeOrder: ['一 (橫)', '二 (橫)', '三 (橫)'],
    },
    {
      id: 'wq_arrow',
      prompt: '看到箭咀指向上 ⬆️，寫出中文字：',
      imageDesc: '向上箭頭',
      correctChar: '上',
      jyutping: 'soeng6',
      strokeCount: 3,
      strokeOrder: ['丨 (豎)', '一 (短橫)', '一 (長橫)'],
    },
  ],
  section2_dictation_fill: [
    {
      id: 'dict_1',
      sentenceBefore: '我愛爸爸和媽',
      sentenceAfter: '。',
      targetWord: '媽',
      fullSentence: '我愛爸爸和媽媽。',
      jyutping: 'ngo5 oi3 baa4 baa1 wo4 maa4 maa1.',
      strokeCount: 13,
      clue: '媽媽的「媽」',
    },
    {
      id: 'dict_2',
      sentenceBefore: '天上有太',
      sentenceAfter: '。',
      targetWord: '陽',
      fullSentence: '天上有太陽。',
      jyutping: 'tin1 soeng6 jau5 taai3 joeng4.',
      strokeCount: 12,
      clue: '太陽的「陽」',
    },
    {
      id: 'dict_3',
      sentenceBefore: '老師教我',
      sentenceAfter: '字。',
      targetWord: '寫',
      fullSentence: '老師教我寫字。（或讀字）',
      jyutping: 'lou5 si1 gaau3 ngo5 se2 zi6.',
      strokeCount: 15,
      clue: '寫字的「寫」',
    },
    {
      id: 'dict_4',
      sentenceBefore: '我有一雙',
      sentenceAfter: '手。',
      targetWord: '小',
      fullSentence: '我有一雙小手。（或巧手）',
      jyutping: 'ngo5 jau5 jat1 soeng1 siu2 sau2.',
      strokeCount: 3,
      clue: '小手的「小」',
    },
  ],
  section3_stroke_counting: [
    {
      id: 'sc_water',
      char: '水',
      jyutping: 'seoi2',
      correctStrokes: 4,
      strokeBreakdown: ['1. 亅 (豎鈎)', '2. ㇇ (橫撇)', '3. ノ (撇)', '4. ㇏ (捺)'],
    },
    {
      id: 'sc_moon',
      char: '月',
      jyutping: 'jyut6',
      correctStrokes: 4,
      strokeBreakdown: ['1. 丿 (撇)', '2. 𠃌 (橫折鈎)', '3. 一 (橫)', '4. 一 (橫)'],
    },
  ],
};
