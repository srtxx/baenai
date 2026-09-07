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

/** ワンタップ記録のクイックアクション（ファーストビュー） */
export interface QuickMealOption {
  emoji: string;
  label: string;
  defaultTag?: string;
}

export const QUICK_MEAL_OPTIONS: QuickMealOption[] = [
  { emoji: "🍳", label: "自炊", defaultTag: "自炊" },
  { emoji: "🍙", label: "コンビニ", defaultTag: "コンビニ" },
  { emoji: "🥗", label: "ヘルシー系", defaultTag: "ヘルシー" },
  { emoji: "🥩", label: "ガッツリ系", defaultTag: "ガッツリ" },
  { emoji: "🍻", label: "飲み会", defaultTag: "飲み会" },
];

/** 食事記録のプリセットタグ */
export const PRESET_TAGS = ["自炊", "コンビニ", "ヘルシー", "ガッツリ", "飲み会", "外食", "カフェ", "テイクアウト"] as const;

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
      { emoji: "🍻", label: "乾杯・飲み会", defaultTag: "飲み会" },
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
      { emoji: "🍳", label: "自炊", defaultTag: "自炊" },
      { emoji: "🍙", label: "コンビニ", defaultTag: "コンビニ" },
      { emoji: "🥗", label: "ヘルシー系", defaultTag: "ヘルシー" },
      { emoji: "🥩", label: "ガッツリ系", defaultTag: "ガッツリ" },
      { emoji: "🍻", label: "飲み会", defaultTag: "飲み会" },
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

