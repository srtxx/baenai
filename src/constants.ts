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

export interface EmojiItem {
  emoji: string;
  label: string;
  defaultTag?: string;
}

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  items: EmojiItem[];
}

/** ジャンル別の豊富な食事絵文字パレット（70種以上） */
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "staple",
    name: "主食・ごはん",
    icon: "🍚",
    items: [
      { emoji: "🍚", label: "ごはん" },
      { emoji: "🍙", label: "おにぎり", defaultTag: "コンビニ" },
      { emoji: "🍞", label: "食パン" },
      { emoji: "🥐", label: "クロワッサン" },
      { emoji: "🥖", label: "フランスパン" },
      { emoji: "🥪", label: "サンドイッチ" },
      { emoji: "🥯", label: "ベーグル" },
      { emoji: "🍜", label: "ラーメン", defaultTag: "外食" },
      { emoji: "🍝", label: "パスタ" },
      { emoji: "🍲", label: "うどん・鍋" },
      { emoji: "🍛", label: "カレー" },
      { emoji: "🍣", label: "お寿司", defaultTag: "外食" },
      { emoji: "🍱", label: "お弁当" },
      { emoji: "🥟", label: "餃子・中華" },
      { emoji: "🍕", label: "ピザ" },
      { emoji: "🍔", label: "ハンバーガー", defaultTag: "外食" },
      { emoji: "🌮", label: "タコス" },
      { emoji: "🌯", label: "ブリトー" },
      { emoji: "🥣", label: "シリアル" },
      { emoji: "🍘", label: "おせんべい" },
    ]
  },
  {
    id: "main_dish",
    name: "おかず・主菜",
    icon: "🍳",
    items: [
      { emoji: "🍳", label: "目玉焼き・卵", defaultTag: "自炊" },
      { emoji: "🥩", label: "ステーキ・肉" },
      { emoji: "🍗", label: "チキン・唐揚げ" },
      { emoji: "🍖", label: "お肉料理" },
      { emoji: "🥓", label: "ベーコン" },
      { emoji: "🐟", label: "焼き魚・魚" },
      { emoji: "🦐", label: "エビ・海鮮" },
      { emoji: "🍤", label: "天ぷら・フライ" },
      { emoji: "🍢", label: "おでん" },
      { emoji: "🫕", label: "シチュー・スープ" },
      { emoji: "🥗", label: "サラダ" },
      { emoji: "🧀", label: "チーズ" },
      { emoji: "🥑", label: "アボカド" },
      { emoji: "🥦", label: "野菜" },
      { emoji: "🌭", label: "ウインナー" },
      { emoji: "🧆", label: "お惣菜" },
      { emoji: "🥔", label: "ポテト" },
      { emoji: "🌽", label: "とうもろこし" },
    ]
  },
  {
    id: "sweets",
    name: "おやつ・果物",
    icon: "🍰",
    items: [
      { emoji: "🍰", label: "ケーキ" },
      { emoji: "🥞", label: "パンケーキ" },
      { emoji: "🍦", label: "ソフトクリーム" },
      { emoji: "🍨", label: "アイス" },
      { emoji: "🍧", label: "かき氷" },
      { emoji: "🍩", label: "ドーナツ" },
      { emoji: "🍪", label: "クッキー" },
      { emoji: "🍫", label: "チョコ" },
      { emoji: "🍮", label: "プリン" },
      { emoji: "🍡", label: "お団子・和菓子" },
      { emoji: "🧇", label: "ワッフル" },
      { emoji: "🍓", label: "いちご" },
      { emoji: "🍌", label: "バナナ" },
      { emoji: "🍎", label: "りんご" },
      { emoji: "🍇", label: "ぶどう" },
      { emoji: "🍊", label: "みかん" },
      { emoji: "🍠", label: "焼き芋" },
      { emoji: "🍑", label: "もも" },
    ]
  },
  {
    id: "drinks",
    name: "飲み物・カフェ",
    icon: "☕️",
    items: [
      { emoji: "☕️", label: "コーヒー" },
      { emoji: "🍵", label: "お茶・緑茶" },
      { emoji: "🫖", label: "紅茶・ポット" },
      { emoji: "🧋", label: "タピオカ・ミルクティー" },
      { emoji: "🥤", label: "スムージー・炭酸" },
      { emoji: "🧃", label: "ジュース" },
      { emoji: "🥛", label: "牛乳・豆乳" },
      { emoji: "🍺", label: "ビール" },
      { emoji: "🍷", label: "ワイン" },
      { emoji: "🍶", label: "日本酒" },
      { emoji: "🍸", label: "カクテル・お酒" },
      { emoji: "🧊", label: "お水" },
    ]
  },
  {
    id: "style",
    name: "状況・スタイル",
    icon: "🏪",
    items: [
      { emoji: "🏪", label: "コンビニ", defaultTag: "コンビニ" },
      { emoji: "🥡", label: "テイクアウト", defaultTag: "テイクアウト" },
      { emoji: "🍽️", label: "外食", defaultTag: "外食" },
      { emoji: "🏠", label: "おうち自炊", defaultTag: "自炊" },
      { emoji: "🚚", label: "デリバリー", defaultTag: "外食" },
      { emoji: "📦", label: "レトルト・冷食" },
      { emoji: "💊", label: "サプリ・薬" },
      { emoji: "🌙", label: "おやすみ", defaultTag: "おやすみ" },
    ]
  }
];

/** やさしい励ましメッセージ */
export const ENCOURAGE_MESSAGES = [
  { emoji: "🍵", label: "おつかれさま" },
  { emoji: "👏", label: "えらい" },
  { emoji: "🌿", label: "ゆるくいこう" },
  { emoji: "✨", label: "今日も最高" },
  { emoji: "🤝", label: "一緒にがんばろ" },
  { emoji: "🍙", label: "おなかすいた" },
] as const;
