// Stroke definitions, Missing stroke puzzles, and Step-by-Step stroke trajectories for Grade 1-2 Vocab

export type StrokeType = 
  | '橫' 
  | '豎' 
  | '撇' 
  | '捺' 
  | '點' 
  | '提' 
  | '橫折' 
  | '豎鉤' 
  | '豎提'
  | '橫撇' 
  | '豎折' 
  | '橫折鉤' 
  | '豎彎鉤' 
  | '撇折' 
  | '撇點' 
  | '臥鉤' 
  | '彎鉤';

export interface StrokeSegment {
  name: StrokeType;
  // Normalized coordinates (0-100) on the Tianzige grid
  start: [number, number];
  end: [number, number];
  points?: [number, number][]; // Multi-point path for complex strokes with corners like 橫折, 橫折鉤, 豎彎鉤, 橫撇
  control?: [number, number]; // Quadratic bezier control point for curves
  directionHint: string; // e.g. "由左向右", "由上向下", "橫向右再向下折"
}

export interface CharacterStrokeDefinition {
  char: string;
  strokesCount: number;
  pinyin: string;
  jyutping: string;
  english: string;
  strokeNames: string[];
  strokes: StrokeSegment[];
  missingStrokePuzzles: {
    puzzleId: string;
    missingStrokeIndex: number; // which stroke index is missing (0-based)
    missingStrokeName: string;
    description: string;
    // Bounding box (0-100) for fast, robust kid stroke validation
    targetZone: { minX: number; maxX: number; minY: number; maxY: number };
    expectedDirection: 'LTR' | 'RTL' | 'TTB' | 'BTT' | 'DIAG_TR_BL' | 'DIAG_TL_BR' | 'ANY_DOT' | 'CORNER_HEN_ZHE';
    hintMessage: string;
  }[];
}

/**
 * Universal canvas renderer for any stroke segment (handling single lines, curves, and cornered polylines)
 */
export function renderStrokeSegmentPath(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeSegment,
  size: number
) {
  ctx.beginPath();
  if (stroke.points && stroke.points.length > 1) {
    const p0 = stroke.points[0];
    ctx.moveTo((p0[0] / 100) * size, (p0[1] / 100) * size);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo((p[0] / 100) * size, (p[1] / 100) * size);
    }
  } else {
    const sx = (stroke.start[0] / 100) * size;
    const sy = (stroke.start[1] / 100) * size;
    const ex = (stroke.end[0] / 100) * size;
    const ey = (stroke.end[1] / 100) * size;
    ctx.moveTo(sx, sy);
    if (stroke.control) {
      const cx = (stroke.control[0] / 100) * size;
      const cy = (stroke.control[1] / 100) * size;
      ctx.quadraticCurveTo(cx, cy, ex, ey);
    } else {
      ctx.lineTo(ex, ey);
    }
  }
  ctx.stroke();
}

export const CHARACTER_STROKE_DATABASE: Record<string, CharacterStrokeDefinition> = {
  木: {
    char: '木',
    strokesCount: 4,
    pinyin: 'mù',
    jyutping: 'muk6',
    english: 'Wood / Tree',
    strokeNames: ['橫', '豎', '撇', '捺'],
    strokes: [
      { name: '橫', start: [20, 36], end: [80, 36], directionHint: '由左向右' },
      { name: '豎', start: [50, 14], end: [50, 88], directionHint: '由上向下' },
      { name: '撇', start: [50, 36], end: [22, 78], control: [34, 58], directionHint: '由右上向左下' },
      { name: '捺', start: [50, 36], end: [82, 78], control: [68, 60], directionHint: '由左上向右下' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'muk_na',
        missingStrokeIndex: 3,
        missingStrokeName: '捺',
        description: '補上「木」字右下方的【捺】畫',
        targetZone: { minX: 42, maxX: 95, minY: 32, maxY: 90 },
        expectedDirection: 'DIAG_TL_BR',
        hintMessage: '在右下方由左上往右下畫出「捺」畫（＼）！',
      },
      {
        puzzleId: 'muk_pit',
        missingStrokeIndex: 2,
        missingStrokeName: '撇',
        description: '補上「木」字左下方的【撇】畫',
        targetZone: { minX: 10, maxX: 58, minY: 32, maxY: 90 },
        expectedDirection: 'DIAG_TR_BL',
        hintMessage: '在左下方由右上往左下畫出「撇」畫（／）！',
      },
    ],
  },

  人: {
    char: '人',
    strokesCount: 2,
    pinyin: 'rén',
    jyutping: 'jan4',
    english: 'Person / Human',
    strokeNames: ['撇', '捺'],
    strokes: [
      { name: '撇', start: [50, 18], end: [20, 84], control: [36, 48], directionHint: '由右上向左下' },
      { name: '捺', start: [42, 44], end: [80, 84], control: [62, 66], directionHint: '由左上向右下' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'jan_na',
        missingStrokeIndex: 1,
        missingStrokeName: '捺',
        description: '補上「人」字的【捺】畫',
        targetZone: { minX: 35, maxX: 90, minY: 35, maxY: 92 },
        expectedDirection: 'DIAG_TL_BR',
        hintMessage: '從撇的中間往右下方補上「捺」畫（＼）！',
      },
    ],
  },

  大: {
    char: '大',
    strokesCount: 3,
    pinyin: 'dà',
    jyutping: 'daai6',
    english: 'Big / Large',
    strokeNames: ['橫', '撇', '捺'],
    strokes: [
      { name: '橫', start: [18, 38], end: [82, 38], directionHint: '由左向右' },
      { name: '撇', start: [50, 16], end: [20, 86], control: [36, 52], directionHint: '由右上向左下' },
      { name: '捺', start: [44, 42], end: [82, 86], control: [65, 66], directionHint: '由左上向右下' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'daai_na',
        missingStrokeIndex: 2,
        missingStrokeName: '捺',
        description: '補上「大」字的右下【捺】畫',
        targetZone: { minX: 38, maxX: 92, minY: 36, maxY: 92 },
        expectedDirection: 'DIAG_TL_BR',
        hintMessage: '在右下方畫出「捺」畫（＼）！',
      },
      {
        puzzleId: 'daai_waang',
        missingStrokeIndex: 0,
        missingStrokeName: '橫',
        description: '補上「大」字頂部的【橫】畫',
        targetZone: { minX: 12, maxX: 88, minY: 22, maxY: 52 },
        expectedDirection: 'LTR',
        hintMessage: '由左至右畫出一條平整的「橫」畫（一）！',
      },
    ],
  },

  太: {
    char: '太',
    strokesCount: 4,
    pinyin: 'tài',
    jyutping: 'taai3',
    english: 'Too / Great (Sun/太陽)',
    strokeNames: ['橫', '撇', '捺', '點'],
    strokes: [
      { name: '橫', start: [18, 34], end: [82, 34], directionHint: '由左向右' },
      { name: '撇', start: [50, 14], end: [20, 82], control: [36, 48], directionHint: '由右上向左下' },
      { name: '捺', start: [44, 38], end: [82, 82], control: [65, 62], directionHint: '由左上向右下' },
      { name: '點', start: [50, 62], end: [55, 74], directionHint: '由左上向右下點' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'taai_dim',
        missingStrokeIndex: 3,
        missingStrokeName: '點',
        description: '補上「太」字正下方的【點】畫（太陽的太）',
        targetZone: { minX: 36, maxX: 66, minY: 52, maxY: 84 },
        expectedDirection: 'ANY_DOT',
        hintMessage: '在「大」字中間下方點上一【點】！',
      },
    ],
  },

  犬: {
    char: '犬',
    strokesCount: 4,
    pinyin: 'quǎn',
    jyutping: 'hyun2',
    english: 'Dog / Hound',
    strokeNames: ['橫', '撇', '捺', '點'],
    strokes: [
      { name: '橫', start: [18, 38], end: [82, 38], directionHint: '由左向右' },
      { name: '撇', start: [50, 16], end: [20, 86], control: [36, 52], directionHint: '由右上向左下' },
      { name: '捺', start: [44, 42], end: [82, 86], control: [65, 66], directionHint: '由左上向右下' },
      { name: '點', start: [68, 16], end: [75, 26], directionHint: '由左上向右下點' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'hyun_dim',
        missingStrokeIndex: 3,
        missingStrokeName: '點',
        description: '補上「犬」字右上角關鍵的【點】畫',
        targetZone: { minX: 58, maxX: 88, minY: 10, maxY: 38 },
        expectedDirection: 'ANY_DOT',
        hintMessage: '在右上角點上一【點】（丶）！',
      },
    ],
  },

  小: {
    char: '小',
    strokesCount: 3,
    pinyin: 'xiǎo',
    jyutping: 'siu2',
    english: 'Small / Little',
    strokeNames: ['豎鉤', '撇', '點'],
    strokes: [
      { name: '豎鉤', points: [[50, 15], [50, 85], [42, 78]], start: [50, 15], end: [42, 78], directionHint: '由上向下出鉤' },
      { name: '撇', start: [32, 42], end: [18, 66], control: [25, 54], directionHint: '左邊點撇' },
      { name: '點', start: [68, 42], end: [82, 66], control: [75, 54], directionHint: '右邊點' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'siu_right_dot',
        missingStrokeIndex: 2,
        missingStrokeName: '點',
        description: '補上「小」字右邊的【點】畫',
        targetZone: { minX: 58, maxX: 92, minY: 35, maxY: 78 },
        expectedDirection: 'ANY_DOT',
        hintMessage: '在中間豎鉤的右邊補上一【點】（丶）！',
      },
      {
        puzzleId: 'siu_left_dot',
        missingStrokeIndex: 1,
        missingStrokeName: '撇',
        description: '補上「小」字左邊的【撇/左點】',
        targetZone: { minX: 10, maxX: 44, minY: 35, maxY: 78 },
        expectedDirection: 'DIAG_TR_BL',
        hintMessage: '在中間豎鉤的左邊補上一【撇】（／）！',
      },
    ],
  },

  心: {
    char: '心',
    strokesCount: 4,
    pinyin: 'xīn',
    jyutping: 'sam1',
    english: 'Heart / Mind',
    strokeNames: ['左點', '臥鉤', '中點', '右點'],
    strokes: [
      { name: '點', start: [24, 44], end: [20, 62], directionHint: '左點由右上至左下' },
      { name: '臥鉤', start: [36, 52], end: [75, 68], control: [55, 85], directionHint: '圓潤臥鉤' },
      { name: '點', start: [48, 38], end: [52, 52], directionHint: '中間點' },
      { name: '點', start: [78, 32], end: [84, 46], directionHint: '右上方外點' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'sam_right_dot',
        missingStrokeIndex: 3,
        missingStrokeName: '右點',
        description: '補上「心」字右上方的【外點】',
        targetZone: { minX: 68, maxX: 95, minY: 20, maxY: 58 },
        expectedDirection: 'ANY_DOT',
        hintMessage: '在臥鉤右上角點上一【點】（丶）！',
      },
      {
        puzzleId: 'sam_mid_dot',
        missingStrokeIndex: 2,
        missingStrokeName: '中點',
        description: '補上「心」字窩心中的【中點】',
        targetZone: { minX: 38, maxX: 64, minY: 26, maxY: 62 },
        expectedDirection: 'ANY_DOT',
        hintMessage: '在心字窩內點上一【點】！',
      },
    ],
  },

  日: {
    char: '日',
    strokesCount: 4,
    pinyin: 'rì',
    jyutping: 'jat6',
    english: 'Sun / Day',
    strokeNames: ['豎', '橫折', '橫', '橫'],
    strokes: [
      { name: '豎', start: [26, 20], end: [26, 80], directionHint: '左豎' },
      { name: '橫折', points: [[26, 20], [74, 20], [74, 80]], start: [26, 20], end: [74, 80], directionHint: '橫向右再向下折' },
      { name: '橫', start: [26, 50], end: [74, 50], directionHint: '中間短橫' },
      { name: '橫', start: [26, 80], end: [74, 80], directionHint: '封口橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'jat_mid_waang',
        missingStrokeIndex: 2,
        missingStrokeName: '橫',
        description: '補上「日」字中間的【橫】畫',
        targetZone: { minX: 20, maxX: 80, minY: 40, maxY: 60 },
        expectedDirection: 'LTR',
        hintMessage: '在日字中間畫一橫（一）！',
      },
      {
        puzzleId: 'jat_close_waang',
        missingStrokeIndex: 3,
        missingStrokeName: '橫',
        description: '補上「日」字底部的【封口橫】',
        targetZone: { minX: 20, maxX: 80, minY: 68, maxY: 90 },
        expectedDirection: 'LTR',
        hintMessage: '在底部由左向右畫橫封口（一）！',
      },
    ],
  },

  目: {
    char: '目',
    strokesCount: 5,
    pinyin: 'mù',
    jyutping: 'muk6',
    english: 'Eye',
    strokeNames: ['豎', '橫折', '橫', '橫', '橫'],
    strokes: [
      { name: '豎', start: [28, 16], end: [28, 84], directionHint: '左豎' },
      { name: '橫折', points: [[28, 16], [72, 16], [72, 84]], start: [28, 16], end: [72, 84], directionHint: '橫向右再向下折' },
      { name: '橫', start: [28, 38], end: [72, 38], directionHint: '第一橫' },
      { name: '橫', start: [28, 60], end: [72, 60], directionHint: '第二橫' },
      { name: '橫', start: [28, 84], end: [72, 84], directionHint: '封口橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'muk_eye_waang2',
        missingStrokeIndex: 3,
        missingStrokeName: '橫',
        description: '「目」字有兩橫，請補上第二條【短橫】',
        targetZone: { minX: 22, maxX: 78, minY: 48, maxY: 72 },
        expectedDirection: 'LTR',
        hintMessage: '目字裏面有兩橫，補上第二橫！',
      },
      {
        puzzleId: 'muk_eye_waang1',
        missingStrokeIndex: 2,
        missingStrokeName: '橫',
        description: '補上「目」字內部第一條【短橫】',
        targetZone: { minX: 22, maxX: 78, minY: 28, maxY: 48 },
        expectedDirection: 'LTR',
        hintMessage: '在目字內部上方畫一短橫（一）！',
      },
    ],
  },

  白: {
    char: '白',
    strokesCount: 5,
    pinyin: 'bái',
    jyutping: 'baak6',
    english: 'White / Clear',
    strokeNames: ['撇', '豎', '橫折', '橫', '橫'],
    strokes: [
      { name: '撇', start: [50, 12], end: [40, 30], directionHint: '頂部短撇' },
      { name: '豎', start: [28, 30], end: [28, 84], directionHint: '左豎' },
      { name: '橫折', points: [[28, 30], [72, 30], [72, 84]], start: [28, 30], end: [72, 84], directionHint: '橫向右再向下折' },
      { name: '橫', start: [28, 56], end: [72, 56], directionHint: '中間短橫' },
      { name: '橫', start: [28, 84], end: [72, 84], directionHint: '封口橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'baak_top_pit',
        missingStrokeIndex: 0,
        missingStrokeName: '撇',
        description: '補上「白」字頂部關鍵的【短撇】（與「日」區別）',
        targetZone: { minX: 32, maxX: 68, minY: 8, maxY: 38 },
        expectedDirection: 'DIAG_TR_BL',
        hintMessage: '在頂部畫一撇（／），讓它變成「白」！',
      },
    ],
  },

  月: {
    char: '月',
    strokesCount: 4,
    pinyin: 'yuè',
    jyutping: 'jyut6',
    english: 'Moon / Month',
    strokeNames: ['撇', '橫折鉤', '橫', '橫'],
    strokes: [
      { name: '撇', start: [28, 14], end: [22, 86], control: [26, 50], directionHint: '左長撇' },
      { name: '橫折鉤', points: [[28, 16], [72, 16], [72, 86], [64, 80]], start: [28, 16], end: [64, 80], directionHint: '橫向右向下折再出鉤' },
      { name: '橫', start: [28, 38], end: [70, 38], directionHint: '內部上橫' },
      { name: '橫', start: [28, 60], end: [70, 60], directionHint: '內部下橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'jyut_mid_waang',
        missingStrokeIndex: 2,
        missingStrokeName: '橫',
        description: '補上「月」字內部的【短橫】',
        targetZone: { minX: 24, maxX: 74, minY: 28, maxY: 50 },
        expectedDirection: 'LTR',
        hintMessage: '在月字內部畫出第一橫（一）！',
      },
    ],
  },

  生: {
    char: '生',
    strokesCount: 5,
    pinyin: 'shēng',
    jyutping: 'saang1',
    english: 'Birth / Life / Student (學生)',
    strokeNames: ['撇', '橫', '豎', '橫', '橫'],
    strokes: [
      { name: '撇', start: [38, 16], end: [22, 38], directionHint: '左短撇' },
      { name: '橫', start: [24, 38], end: [76, 38], directionHint: '上橫' },
      { name: '豎', start: [50, 18], end: [50, 84], directionHint: '中長豎' },
      { name: '橫', start: [30, 58], end: [70, 58], directionHint: '中短橫' },
      { name: '橫', start: [16, 84], end: [84, 84], directionHint: '底長橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'saang_bottom_waang',
        missingStrokeIndex: 4,
        missingStrokeName: '橫',
        description: '補上「生」字底部的【長橫】',
        targetZone: { minX: 12, maxX: 88, minY: 72, maxY: 94 },
        expectedDirection: 'LTR',
        hintMessage: '在最底部由左向右畫一條穩穩的長橫（一）！',
      },
    ],
  },

  土: {
    char: '土',
    strokesCount: 3,
    pinyin: 'tǔ',
    jyutping: 'tou2',
    english: 'Soil / Earth',
    strokeNames: ['橫', '豎', '橫'],
    strokes: [
      { name: '橫', start: [30, 42], end: [70, 42], directionHint: '上短橫' },
      { name: '豎', start: [50, 14], end: [50, 84], directionHint: '中立豎' },
      { name: '橫', start: [16, 84], end: [84, 84], directionHint: '底長橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'tou_top_waang',
        missingStrokeIndex: 0,
        missingStrokeName: '橫',
        description: '補上「土」字上方的【短橫】',
        targetZone: { minX: 22, maxX: 78, minY: 30, maxY: 55 },
        expectedDirection: 'LTR',
        hintMessage: '在上方畫一條短橫（一）！',
      },
    ],
  },

  王: {
    char: '王',
    strokesCount: 4,
    pinyin: 'wáng',
    jyutping: 'wong4',
    english: 'King / Monarch (國王)',
    strokeNames: ['橫', '橫', '豎', '橫'],
    strokes: [
      { name: '橫', start: [24, 22], end: [76, 22], directionHint: '頂橫' },
      { name: '橫', start: [30, 50], end: [70, 50], directionHint: '中短橫' },
      { name: '豎', start: [50, 22], end: [50, 82], directionHint: '中豎' },
      { name: '橫', start: [18, 82], end: [82, 82], directionHint: '底長橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'wong_mid_waang',
        missingStrokeIndex: 1,
        missingStrokeName: '橫',
        description: '補上「王」字中間的【短橫】（由「工」變「王」）',
        targetZone: { minX: 24, maxX: 76, minY: 38, maxY: 62 },
        expectedDirection: 'LTR',
        hintMessage: '在中間畫上一條橫線，變成「王」！',
      },
    ],
  },

  玉: {
    char: '玉',
    strokesCount: 5,
    pinyin: 'yù',
    jyutping: 'juk6',
    english: 'Jade / Gem',
    strokeNames: ['橫', '橫', '豎', '橫', '點'],
    strokes: [
      { name: '橫', start: [24, 20], end: [76, 20], directionHint: '頂橫' },
      { name: '橫', start: [30, 48], end: [70, 48], directionHint: '中短橫' },
      { name: '豎', start: [50, 20], end: [50, 80], directionHint: '中豎' },
      { name: '橫', start: [18, 80], end: [82, 80], directionHint: '底長橫' },
      { name: '點', start: [66, 60], end: [74, 72], directionHint: '右下點' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'juk_dot',
        missingStrokeIndex: 4,
        missingStrokeName: '點',
        description: '補上「玉」字右下角的【寶玉點】',
        targetZone: { minX: 58, maxX: 85, minY: 52, maxY: 78 },
        expectedDirection: 'ANY_DOT',
        hintMessage: '在王字右下方點上一【點】（丶），變身成寶玉的「玉」！',
      },
    ],
  },

  草: {
    char: '草',
    strokesCount: 9,
    pinyin: 'cǎo',
    jyutping: 'cou2',
    english: 'Grass / Herb',
    strokeNames: ['橫', '豎', '豎', '豎', '橫折', '橫', '橫', '橫', '豎'],
    strokes: [
      { name: '橫', start: [20, 20], end: [80, 20], directionHint: '草字頭長橫' },
      { name: '豎', start: [36, 10], end: [36, 28], directionHint: '草字頭左短豎' },
      { name: '豎', start: [64, 10], end: [64, 28], directionHint: '草字頭右短豎' },
      { name: '豎', start: [32, 36], end: [32, 58], directionHint: '日部左豎' },
      { name: '橫折', points: [[32, 36], [68, 36], [68, 58]], start: [32, 36], end: [68, 58], directionHint: '日部橫折' },
      { name: '橫', start: [32, 47], end: [68, 47], directionHint: '日部中橫' },
      { name: '橫', start: [32, 58], end: [68, 58], directionHint: '日部底橫' },
      { name: '橫', start: [18, 70], end: [82, 70], directionHint: '十部長橫' },
      { name: '豎', start: [50, 60], end: [50, 94], directionHint: '十部長豎' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'cou_top_waang',
        missingStrokeIndex: 0,
        missingStrokeName: '橫',
        description: '補上「草」字頂部草字頭（艹）的【主橫】',
        targetZone: { minX: 15, maxX: 85, minY: 10, maxY: 32 },
        expectedDirection: 'LTR',
        hintMessage: '在最頂部由左向右畫出一條草字頭的橫畫（一）！',
      },
    ],
  },

  苦: {
    char: '苦',
    strokesCount: 8,
    pinyin: 'kǔ',
    jyutping: 'fu2',
    english: 'Bitter / Hardship (辛苦)',
    strokeNames: ['橫', '豎', '豎', '橫', '豎', '豎', '橫折', '橫'],
    strokes: [
      { name: '橫', start: [18, 22], end: [82, 22], directionHint: '草字頭長橫' },
      { name: '豎', start: [36, 12], end: [36, 30], directionHint: '草字頭左豎' },
      { name: '豎', start: [64, 12], end: [64, 30], directionHint: '草字頭右豎' },
      { name: '橫', start: [24, 44], end: [76, 44], directionHint: '古字頭長橫' },
      { name: '豎', start: [50, 32], end: [50, 58], directionHint: '古字中豎' },
      { name: '豎', start: [32, 64], end: [32, 88], directionHint: '口字左豎' },
      { name: '橫折', points: [[32, 64], [68, 64], [68, 88]], start: [32, 64], end: [68, 88], directionHint: '口字橫折' },
      { name: '橫', start: [32, 88], end: [68, 88], directionHint: '口字封口橫' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'fu_top_waang',
        missingStrokeIndex: 0,
        missingStrokeName: '橫',
        description: '補上「苦」字頂部草字頭（艹）的【長橫】',
        targetZone: { minX: 14, maxX: 86, minY: 12, maxY: 32 },
        expectedDirection: 'LTR',
        hintMessage: '在頂部畫出草字頭橫畫（一），完成「苦」字！',
      },
    ],
  },

  像: {
    char: '像',
    strokesCount: 13,
    pinyin: 'xiàng',
    jyutping: 'zoeng6',
    english: 'Resemble / Like / Image (好像)',
    strokeNames: ['撇', '豎', '撇', '橫撇', '點', '橫', '撇', '豎提', '彎鉤', '撇', '撇', '撇', '捺'],
    strokes: [
      { name: '撇', start: [26, 18], end: [12, 46], directionHint: '單人旁短撇' },
      { name: '豎', start: [20, 34], end: [20, 86], directionHint: '單人旁垂露豎' },
      { name: '撇', start: [52, 14], end: [42, 28], directionHint: '象部短撇' },
      { name: '橫撇', points: [[42, 24], [76, 24], [66, 38]], start: [42, 24], end: [66, 38], directionHint: '橫向右再向左下撇' },
      { name: '點', start: [58, 28], end: [64, 38], directionHint: '中間點' },
      { name: '橫', start: [38, 44], end: [82, 44], directionHint: '象中橫' },
      { name: '撇', start: [48, 44], end: [36, 68], directionHint: '象左撇' },
      { name: '豎提', points: [[56, 44], [56, 66], [66, 60]], start: [56, 44], end: [66, 60], directionHint: '向下豎再向右上提' },
      { name: '彎鉤', start: [66, 44], end: [78, 68], control: [78, 54], directionHint: '右彎鉤' },
      { name: '撇', start: [44, 70], end: [32, 88], directionHint: '底撇一' },
      { name: '撇', start: [54, 70], end: [44, 90], directionHint: '底撇二' },
      { name: '撇', start: [64, 70], end: [56, 92], directionHint: '底撇三' },
      { name: '捺', start: [66, 68], end: [86, 90], directionHint: '底捺' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'zoeng_dan_jan_shu',
        missingStrokeIndex: 1,
        missingStrokeName: '豎',
        description: '補上「像」字左側單人旁（亻）的【垂露豎】',
        targetZone: { minX: 8, maxX: 32, minY: 28, maxY: 92 },
        expectedDirection: 'TTB',
        hintMessage: '在左邊單人旁撇下由上向下畫一豎（丨），完成「亻」偏旁！',
      },
    ],
  },

  脫: {
    char: '脫',
    strokesCount: 11,
    pinyin: 'tuō',
    jyutping: 'tyut3',
    english: 'Take off / Shed (脫落)',
    strokeNames: ['撇', '橫折鉤', '橫', '橫', '點', '點', '橫撇', '豎', '橫折', '撇', '豎彎鉤'],
    strokes: [
      { name: '撇', start: [20, 20], end: [14, 82], directionHint: '月字旁長撇' },
      { name: '橫折鉤', points: [[20, 20], [38, 20], [38, 82], [34, 78]], start: [20, 20], end: [34, 78], directionHint: '月部橫折鉤' },
      { name: '橫', start: [20, 40], end: [36, 40], directionHint: '月部上橫' },
      { name: '橫', start: [20, 60], end: [36, 60], directionHint: '月部下橫' },
      { name: '點', start: [52, 16], end: [56, 26], directionHint: '右頂點一' },
      { name: '點', start: [74, 16], end: [70, 26], directionHint: '右頂點二' },
      { name: '橫撇', points: [[50, 30], [80, 30], [68, 44]], start: [50, 30], end: [68, 44], directionHint: '兌部橫撇' },
      { name: '豎', start: [52, 48], end: [52, 66], directionHint: '口部左豎' },
      { name: '橫折', points: [[52, 48], [78, 48], [78, 66]], start: [52, 48], end: [78, 66], directionHint: '口部橫折' },
      { name: '撇', start: [56, 68], end: [46, 90], directionHint: '兒部撇' },
      { name: '豎彎鉤', points: [[68, 68], [68, 86], [84, 86], [84, 80]], start: [68, 68], end: [84, 80], directionHint: '兒部豎彎鉤' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'tyut_right_hook',
        missingStrokeIndex: 10,
        missingStrokeName: '豎彎鉤',
        description: '補上「脫」字右下角「兒」部的【豎彎鉤】（乚）',
        targetZone: { minX: 58, maxX: 92, minY: 60, maxY: 94 },
        expectedDirection: 'TTB',
        hintMessage: '在右下方由上向下圓潤畫出豎彎鉤（乚）！',
      },
    ],
  },

  友: {
    char: '友',
    strokesCount: 4,
    pinyin: 'yǒu',
    jyutping: 'jau5',
    english: 'Friend (朋友)',
    strokeNames: ['橫', '撇', '橫撇', '捺'],
    strokes: [
      { name: '橫', start: [22, 28], end: [78, 28], directionHint: '上橫' },
      { name: '撇', start: [50, 14], end: [18, 76], control: [34, 46], directionHint: '左長撇' },
      { name: '橫撇', points: [[38, 48], [72, 48], [54, 66]], start: [38, 48], end: [54, 66], directionHint: '橫向右再向左下撇' },
      { name: '捺', start: [34, 48], end: [82, 88], control: [56, 68], directionHint: '右大捺' },
    ],
    missingStrokePuzzles: [
      {
        puzzleId: 'jau_na',
        missingStrokeIndex: 3,
        missingStrokeName: '捺',
        description: '補上「友」字右下方的【捺】畫',
        targetZone: { minX: 32, maxX: 90, minY: 44, maxY: 94 },
        expectedDirection: 'DIAG_TL_BR',
        hintMessage: '由交界處往右下平穩有力畫出「捺」畫（＼）！',
      },
    ],
  },
};

export const CHARACTER_LIST_FOR_TRACER: string[] = [
  '木', '人', '大', '太', '小', '犬', '日', '目', '白', '月', '心', '生', '土', '王', '玉', '草', '苦', '像', '脫', '友'
];
