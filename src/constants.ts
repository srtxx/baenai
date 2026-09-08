export const APP_NAME = "mog";
export const APP_TAGLINE = "たべる、のこす、いきる。";

export const DAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

/** 日替わりのエピグラフ（哲学・文学のサンプリング引用） */
export const DAILY_EPIGRAPHS = [
  "何を食べているかを見れば、その人がどう生きたかがわかる。 — ブリア＝サヴァラン",
  "質素なパンと水があれば、人は十分に幸福であれる。 — エピクロス",
  "当たり前の日常をそのまま生きること。それ以上の美徳はない。 — モンテーニュ",
  "何も行わない時間、食べない時間にも、静かな意味がある。 — 荘子",
  "完璧を求めるのをやめたとき、暮らしは静けさを取り戻す。 — セネカ",
  "完璧にととのった生活など、初めからどこにもない。 — 吉田兼好",
  "今日の食卓が、明日のあなたを静かにかたちづくる。 — ニーチェ",
] as const;

/** 食事の時間帯ラベル */
export const MEAL_LABELS = ["あさごはん", "ひるごはん", "よるごはん"] as const;

/** ワンタップ記録のクイックアクション（生活スタイルの大分類） */
export interface QuickMealOption {
  id: string;
  icon: "pan" | "store" | "utensils" | "coffee" | "takeout";
  label: string;
  defaultTag: string;
}

export const QUICK_MEAL_OPTIONS: QuickMealOption[] = [
  { id: "cook", icon: "pan", label: "自炊", defaultTag: "自炊" },
  { id: "store", icon: "store", label: "コンビニ", defaultTag: "コンビニ" },
  { id: "out", icon: "utensils", label: "外食", defaultTag: "外食" },
  { id: "cafe", icon: "coffee", label: "カフェ", defaultTag: "カフェ" },
  { id: "takeout", icon: "takeout", label: "テイクアウト", defaultTag: "テイクアウト" },
];

/** 食事記録のプリセットタグ */
export const PRESET_TAGS = ["自炊", "コンビニ", "外食", "カフェ", "テイクアウト", "ヘルシー", "ガッツリ", "飲み会"] as const;


