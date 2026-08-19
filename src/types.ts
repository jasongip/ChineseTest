export type ExamSection = 
  | 'overview'
  | 'part1_speaking_1' 
  | 'part1_speaking_2' 
  | 'part1_speaking_3'
  | 'part2_reading_1' 
  | 'part2_matching_2' 
  | 'part2_choices_3' 
  | 'part2_writing_4'
  | 'vocab_practice'
  | 'daily_practice'
  | 'report'
  | 'print';

export interface CandidateInfo {
  nameEn: string;
  nameZh: string;
  age: number;
  schoolTarget: string;
  totalTimeMinutes: number;
  testDate: string;
}

export interface ScoreState {
  // Part 1 Speaking (Max 30)
  p1_q1_self_intro: number; // Max 5
  p1_q2_family: number;     // Max 5
  p1_q3_hobby: number;      // Max 5
  p1_q4_weather: number;    // Max 5
  p1_sec2_body_parts: number; // Max 10
  p1_sec2_stationery_colors: number; // Max 10
  p1_sec2_scene_desc: number; // Max 10
  p1_sec3_commands: number; // Max 15 (3 commands * 5)

  // Part 2 Written & Reading (Max 70)
  p2_reading_scores: Record<string, number>; // Words read correctly (0 to 1 each)
  p2_matching_antonyms: Record<string, string>; // user paired
  p2_matching_pictures: Record<string, string>; // user paired
  p2_mc_answers: Record<string, string>; // user selected A, B, C
  p2_writing_answers: {
    q1_apples: string;
    q1_arrow: string;
    q2_mom: string;
    q2_sun: string;
    q2_write: string;
    q2_hand: string;
    q3_water_strokes: string;
    q3_moon_strokes: string;
  };
  examinerNotes: string;
}

export interface ReadingGroup {
  id: number;
  title: string;
  words: {
    char: string;
    jyutping: string;
    meaning?: string;
  }[];
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  leftJyutping?: string;
  rightJyutping?: string;
  leftIcon?: string;
  rightIcon?: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  jyutping: string;
}
