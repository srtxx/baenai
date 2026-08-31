export const APP_NAME = "mog";
export const APP_TAGLINE = "たべる、のこす、いきる。";

export const DAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

/** 日替わりのエピグラフ（月〜日） */
export const DAILY_EPIGRAPHS = [
  "食べることは、生きていることの、いちばん静かな証明だ",
  "完璧な食事などない。完璧な一日もない。だからいい。",
  "今日のごはんは、今日だけのもの。",
  "何も食べない日があっても、あなたは何も失っていない。",
  "一週間は、あと少し。",
  "休むことは、サボることではない。",
  "来週もまた、ゆるく始めよう。",
] as const;

/** 食事の時間帯ラベル */
export const MEAL_LABELS = ["あさごはん", "ひるごはん", "よるごはん"] as const;

/** ワンタップ記録のクイックアクション */
export const QUICK_MEAL_OPTIONS = [
  { emoji: "🍚", label: "食べた", tags: [] },
  { emoji: "🍙", label: "コンビニ", tags: ["コンビニ"] },
  { emoji: "🍳", label: "自炊", tags: ["自炊"] },
  { emoji: "🍜", label: "外食", tags: ["外食"] },
] as const;

/** やさしい励ましメッセージ */
export const ENCOURAGE_MESSAGES = [
  { emoji: "🍵", label: "おつかれさま" },
  { emoji: "👏", label: "えらい" },
  { emoji: "🌿", label: "ゆるくいこう" },
  { emoji: "✨", label: "今日も最高" },
  { emoji: "🤝", label: "一緒にがんばろ" },
  { emoji: "🍙", label: "おなかすいた" },
] as const;
