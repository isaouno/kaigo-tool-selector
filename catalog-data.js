const CatalogData = {
  meta: {
    title: "ACCORD CLUB Acolclub レンタル商品カタログ vol.26",
    pdf: "acolclub.pdf",
    note: "acolclub.pdf の目次と抽出可能な商品情報から、介護保険レンタル対象品を中心に選定データ化しています。食事用品、シャワーチェア、ポータブルトイレなど購入・自費系はこのカタログの掲載外として扱います。",
    defaultPage: 1,
    defaultPdfPage: 3,
    pdfPageCount: 94,
    pageMap: Object.fromEntries(Array.from({ length: 90 }, (_, index) => [index + 1, index + 3])),
    previewImages: false,
    defaultPages: [
      { name: "特殊寝台", page: 4, pdfPage: 6 },
      { name: "歩行器", page: 28, pdfPage: 30 },
      { name: "手すり", page: 38, pdfPage: 40 },
      { name: "車いす", page: 52, pdfPage: 54 },
      { name: "見守り機器", page: 86, pdfPage: 88 }
    ]
  },
  fieldLabels: {
    scene: "相談場面",
    ability: "困っている動作",
    caregiver: "手伝う人・負担",
    goal: "優先したいこと",
    environment: "設置場所・条件"
  },
  scenes: {
    bath: {
      label: "入浴",
      keywords: ["入浴", "浴室", "風呂", "お風呂", "シャワー", "浴槽", "洗身", "洗髪", "またぐ", "バス"],
      lens: "Acolclubはレンタル用品中心のため、入浴では手すりや移動用具の確認が中心です。シャワーチェアや浴槽台など購入系は掲載外のため、必要時は別カタログ確認が必要です。",
      actions: [
        "浴室入口幅、段差、洗い場の広さ、浴槽縁の高さを測る。",
        "Acolclub内で確認できる置き型手すりや移動用具で足りるか、専門相談員へ相談する。",
        "シャワーチェアや浴槽台が必要な場合は、購入品カタログまたは特定福祉用具販売の確認を依頼する。"
      ],
      items: [
        {
          id: "bath-shower-chair",
          type: "シャワーチェア（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "座って洗身するための購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "立位での洗身が不安な場合に有効だが、別カタログ確認が必要。",
          demerits: "Acolclub内に該当ページがないため、掲載商品としては提案しない。",
          fit: "座位保持は可能だが、立って洗うとふらつく。",
          triggers: ["シャワー", "洗身", "洗う", "洗髪", "ふらつき"],
          goals: ["safety", "self"]
        },
        {
          id: "bath-tub-step",
          type: "浴槽台・すのこ（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "浴槽またぎを補助する購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "浴槽縁を越える動作を小さくできる可能性がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "浴槽またぎが難しいが、手すりや見守りがあれば立位・座位を保てる。",
          triggers: ["浴槽", "またぎ", "またぐ", "湯船", "段差", "高さ"],
          goals: ["self", "safety"]
        },
        {
          id: "bath-tub-rail",
          type: "置き型手すり・浴室外手すり",
          page: 50,
          pdfPage: 52,
          features: "Acolclub掲載の置き型手すりを、浴室入口や脱衣所など濡れにくい場所の支えとして検討する。",
          merits: "工事なしで支えを追加しやすく、本人の自立動作を残しやすい。",
          demerits: "浴槽内や水濡れ部で使える商品かは別途確認が必要。",
          fit: "浴室入口や浴槽またぎ前後で、つかまる場所が不足している。",
          triggers: ["手すり", "つかまる", "支え", "浴槽", "またぎ", "またぐ"],
          goals: ["self", "safety"]
        },
        {
          id: "bath-transfer-board",
          type: "浴槽ボード・移乗サポート（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "座った姿勢で浴槽へ移る購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "浴槽またぎの負担を下げられる場合がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "浴槽をまたぐのが危ない、片麻痺や車いす利用がある。",
          triggers: ["移乗", "車いす", "片麻痺", "またげない", "抱える"],
          goals: ["caregiver", "safety"]
        },
        {
          id: "bath-shower-carry",
          type: "シャワーキャリー（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "座ったまま浴室移動する入浴用品。Acolclubレンタルカタログでは掲載外。",
          merits: "歩行困難時の入浴介助に役立つ場合がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "歩行困難、立位保持困難、浴室までの移動介助が大きい。",
          triggers: ["歩けない", "移動", "全介助", "寝たきり", "シャワーキャリー"],
          goals: ["caregiver", "safety"]
        }
      ]
    },
    toilet: {
      label: "排泄",
      keywords: ["排泄", "トイレ", "便座", "失禁", "尿", "便", "おむつ", "オムツ", "夜間", "ポータブル"],
      lens: "Acolclubではトイレ周辺の支えとして使える置き型手すりを確認できます。ポータブルトイレ、補高便座、パッド、清拭用品は購入系のため掲載外です。",
      actions: [
        "便器周囲の左右スペース、立ち座り時につかむ位置、床面の安定性を測る。",
        "工事なしのトイレ用手すりや置き型手すりをAcolclub掲載品から試せるか相談する。",
        "ポータブルトイレや補高便座が必要な場合は、購入品カタログを確認する。"
      ],
      items: [
        {
          id: "toilet-portable",
          type: "ポータブルトイレ（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "ベッド近くに置く購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "夜間や歩行不安時に移動距離を短くできる。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "夜間に間に合わない、トイレまでの歩行が危険。",
          triggers: ["夜間", "間に合わない", "ポータブル", "ベッド", "歩けない"],
          goals: ["safety", "caregiver"]
        },
        {
          id: "toilet-rail",
          type: "トイレ用手すり・置き型手すり",
          page: 51,
          pdfPage: 53,
          features: "Acolclub掲載の手すりで、便座周囲の立ち座りと方向転換を支える。",
          merits: "本人の立ち座り能力を残しながら介助量を減らしやすい。",
          demerits: "便器形状、左右スペース、床面の安定性で適合が分かれる。",
          fit: "立ち座りやズボン操作時にふらつくが、把持できれば動作できる。",
          triggers: ["立ち上がり", "座る", "手すり", "ふらつき", "方向転換"],
          goals: ["self", "safety"]
        },
        {
          id: "toilet-seat",
          type: "補高便座（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "便座を高くする購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "膝や腰への負担を下げられる場合がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "便座が低く、立ち上がりに時間がかかる、膝痛がある。",
          triggers: ["低い", "膝", "立てない", "便座", "高さ"],
          goals: ["self", "caregiver"]
        },
        {
          id: "toilet-pad",
          type: "尿とりパッド・紙おむつ（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "排泄ケア用の購入・自費系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "尿もれや寝具汚れを減らす目的で使う。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "失禁がある、夜間交換が難しい、衣類や寝具汚染が続いている。",
          triggers: ["失禁", "尿漏れ", "おむつ", "オムツ", "パッド", "汚れる"],
          goals: ["caregiver", "hygiene"]
        },
        {
          id: "toilet-clean",
          type: "おしり洗浄液・おしりふき（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "清拭・清潔保持の購入・自費系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "清潔保持や皮膚トラブル予防に役立つ場合がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "排泄後の清拭介助が多い、かぶれや臭気が気になる。",
          triggers: ["清拭", "かぶれ", "臭い", "おしり", "拭く"],
          goals: ["hygiene", "caregiver"]
        }
      ]
    },
    bed: {
      label: "ベッド周り",
      keywords: ["ベッド", "寝返り", "起き上がり", "床ずれ", "褥瘡", "移乗", "寝たきり", "サイドレール"],
      lens: "Acolclubでは特殊寝台、付属品、床ずれ防止用具、体位変換器、移動用リフトを確認できます。起き上がり、端座位保持、移乗、体圧分散を分けて選ぶことが重要です。",
      actions: [
        "ベッド高さ、マットレス厚、立ち上がる側の空間、車いすを横付けする幅を確認する。",
        "寝返り頻度、皮膚発赤、抱え上げ介助の有無を記録する。",
        "Acolclub掲載の特殊寝台、ベッド用手すり、床ずれ防止用具、リフトから試用候補を相談する。"
      ],
      items: [
        {
          id: "bed-care-bed",
          type: "特殊寝台",
          page: 4,
          pdfPage: 6,
          features: "背上げ・高さ調整で起き上がりと介助姿勢を整える。",
          merits: "本人の起き上がりを助け、介助者の腰への負担を下げやすい。",
          demerits: "設置面積と搬入経路が必要。サイドレールのすき間リスクに注意する。",
          fit: "起き上がり、端座位、移乗のいずれかに介助が必要。",
          triggers: ["起き上がり", "寝たきり", "高さ", "ベッド", "腰"],
          goals: ["self", "caregiver"]
        },
        {
          id: "bed-rail",
          type: "特殊寝台付属品・ベッド用手すり",
          page: 10,
          pdfPage: 12,
          features: "ベッドサイドレールやサポートグリップで把持点を作る。",
          merits: "起き上がり、端座位保持、立ち上がりを支えやすい。",
          demerits: "ベッド機種、マットレス厚、挟み込みリスクの確認が必要。",
          fit: "支えがあれば寝返り・起き上がり・立ち上がりができる。",
          triggers: ["手すり", "支え", "つかまる", "立ち上がり", "起き上がり", "起きる", "端座位", "ベッド横", "サイドレール", "介助バー"],
          goals: ["self", "safety"]
        },
        {
          id: "bed-pressure",
          type: "床ずれ防止用具",
          page: 16,
          pdfPage: 18,
          features: "体圧分散マットレスやエアマットで皮膚リスクを下げる。",
          merits: "寝返りが少ない人の皮膚トラブル予防に有効。",
          demerits: "沈み込みにより端座位や移乗が不安定になる場合がある。",
          fit: "寝返り困難、長時間臥床、発赤や褥瘡リスクがある。",
          triggers: ["床ずれ", "褥瘡", "寝返り", "赤み", "マット"],
          goals: ["safety", "hygiene"]
        },
        {
          id: "bed-transfer-glove",
          type: "体位変換器",
          page: 25,
          pdfPage: 27,
          features: "摩擦を減らし、ベッド上の位置修正や体位変換を助ける。",
          merits: "皮膚への負担と介助者の腕・腰への負担を下げやすい。",
          demerits: "使い方の習熟が必要。全介助移乗を単独で解決する用具ではない。",
          fit: "ベッド上でのずり上げ、体位変換、移乗準備に負担がある。",
          triggers: ["ずり上げ", "体位変換", "移乗", "重い", "摩擦"],
          goals: ["caregiver", "hygiene"]
        },
        {
          id: "bed-lift",
          type: "移動用リフト",
          page: 79,
          pdfPage: 81,
          features: "吊り具や昇降機構で移乗時の抱え上げを機械的に補助する。",
          merits: "全介助に近い移乗で、介助者の腰への負担を大きく減らせる。",
          demerits: "設置スペース、吊り具適合、操作習熟、心理的受容の確認が必要。",
          fit: "立位保持が困難で、抱え上げ移乗が常態化している。",
          triggers: ["全介助", "抱え上げ", "抱える", "持ち上げる", "移乗", "腰痛", "立てない", "リフト"],
          goals: ["caregiver", "safety"]
        }
      ]
    },
    mobility: {
      label: "移動・歩行",
      keywords: ["移動", "歩行", "歩く", "転倒", "車いす", "車椅子", "杖", "歩行器", "歩行車", "段差", "外出", "玄関"],
      lens: "Acolclubでは歩行補助杖、歩行器・歩行車、車いす、スロープを確認できます。支持量、ブレーキ操作、段差、疲労の出方を分けて見ることが重要です。",
      actions: [
        "屋内通路幅、玄関段差、よく歩く距離、休憩が必要になる距離を確認する。",
        "転倒歴、ふらつく方向、握力、ブレーキ操作の可否を整理する。",
        "Acolclub掲載の杖・歩行器・歩行車・車いす・スロープの試用を依頼する。"
      ],
      items: [
        {
          id: "mob-wheelchair",
          type: "車いす",
          page: 52,
          pdfPage: 54,
          features: "座位での移動を確保し、介助式、自走式、モジュール式の適合を選ぶ。",
          merits: "歩行距離が短い人でも外出や通院の移動範囲を広げやすい。",
          demerits: "座幅、座奥行、フットサポート、住環境の通路幅確認が必要。",
          fit: "歩行距離が短い、屋外移動が難しい、転倒リスクが高い。",
          triggers: ["車いす", "車椅子", "外出", "通院", "歩けない", "長距離"],
          goals: ["self", "safety"]
        },
        {
          id: "mob-wheelchair-cushion",
          type: "車いす付属品・クッション",
          page: 58,
          pdfPage: 60,
          features: "座位保持、除圧、姿勢崩れの補正を目的に選ぶ。",
          merits: "長時間座位の痛みや皮膚リスクを軽減しやすい。",
          demerits: "厚みで座面高が変わる。移乗や足こぎに影響する場合がある。",
          fit: "車いす座位が長い、姿勢が崩れる、坐骨部の痛みや発赤がある。",
          triggers: ["痛い", "長時間", "姿勢", "ずれる", "クッション"],
          goals: ["safety", "hygiene"]
        },
        {
          id: "mob-slope",
          type: "スロープ",
          page: 76,
          pdfPage: 78,
          features: "玄関や室内段差を越えるための勾配を作る。",
          merits: "車いすや歩行器での段差介助を減らせる。",
          demerits: "段差高さに対する必要長さと設置スペースが不足すると危険。",
          fit: "玄関、掃き出し窓、室内段差で移動が止まる。",
          triggers: ["段差", "玄関", "スロープ", "上がれない", "車いす"],
          goals: ["safety", "caregiver"]
        },
        {
          id: "mob-walker",
          type: "歩行器・歩行車",
          page: 28,
          pdfPage: 30,
          features: "歩行器、歩行車、屋内外用の支持具で歩行を支える。",
          merits: "両手支持や休憩を使いながら歩けるため、移動の継続に向く。",
          demerits: "ブレーキ操作、方向転換、屋内通路幅の確認が必要。",
          fit: "両手で支持すれば歩ける、外出で疲れやすい、休憩しながら歩きたい。",
          triggers: ["歩行車", "歩行器", "外", "外出", "休む", "疲れる", "買い物"],
          goals: ["self", "safety"]
        },
        {
          id: "mob-cane",
          type: "歩行補助杖",
          page: 27,
          pdfPage: 29,
          features: "片側支持を追加し、歩行時のふらつきを補う。",
          merits: "軽量で導入しやすく、屋内外の短距離歩行に使いやすい。",
          demerits: "支持量には限界がある。強いふらつきや両側支持が必要な人には不足する。",
          fit: "片側のふらつき、軽度の筋力低下、短距離歩行の不安がある。",
          triggers: ["杖", "ふらつき", "片足", "短距離", "支え"],
          goals: ["self", "safety"]
        }
      ]
    },
    meal: {
      label: "食事",
      keywords: ["食事", "食べる", "飲む", "嚥下", "むせる", "とろみ", "スプーン", "箸", "皿", "エプロン"],
      lens: "Acolclubは介護保険レンタルカタログのため、食事用品や嚥下補助食品は掲載外です。食事相談では移動用品へ誘導せず、別カタログ確認を案内します。",
      actions: [
        "むせる食品、飲み込みにくい水分、食事姿勢、食事時間を記録する。",
        "嚥下に不安がある場合は医師・歯科医師・言語聴覚士へ確認する。",
        "食事用品、介護食品、とろみ剤は購入品カタログで確認する。"
      ],
      items: [
        {
          id: "meal-soft-food",
          type: "介護食品・やわらか食（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "噛む力や飲み込みに合わせた購入系食品。Acolclubレンタルカタログでは掲載外。",
          merits: "食事量と栄養を確保しやすい。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "噛む力が落ちた、普通食が食べづらい、食事量が減っている。",
          triggers: ["噛めない", "やわらか", "食べづらい", "栄養", "量が減る"],
          goals: ["hygiene", "self"]
        },
        {
          id: "meal-thickener",
          type: "とろみ調整食品（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "水分に粘度をつける購入系食品。Acolclubレンタルカタログでは掲載外。",
          merits: "水やお茶でむせやすい人の嚥下安全を高めやすい。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "水分でむせる、咳き込む、飲み込みに時間がかかる。",
          triggers: ["むせる", "嚥下", "水", "お茶", "とろみ", "咳"],
          goals: ["safety", "hygiene"]
        },
        {
          id: "meal-spoon",
          type: "スプーン・フォーク（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "自力摂取を助ける購入系食具。Acolclubレンタルカタログでは掲載外。",
          merits: "手指の動きに合わせると食事介助を減らしやすい。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "スプーンをうまく動かせない、握る力が弱い。",
          triggers: ["スプーン", "フォーク", "握れない", "片麻痺", "手"],
          goals: ["self", "caregiver"]
        },
        {
          id: "meal-dish",
          type: "食器・すべり止めマット（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "食器の動きやこぼれを減らす購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "本人が食べる動作を続けやすい。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "皿が動く、片手で食べる、こぼしやすい。",
          triggers: ["皿", "こぼす", "片手", "すべる", "食器"],
          goals: ["self", "caregiver"]
        },
        {
          id: "meal-apron",
          type: "介護用エプロン（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "衣類汚染を防ぐ購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "清潔保持と後片付けの負担軽減につながる。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "食べこぼしが多い、衣類交換や洗濯が負担。",
          triggers: ["エプロン", "汚れる", "こぼす", "洗濯", "衣類"],
          goals: ["caregiver", "hygiene"]
        }
      ]
    },
    housing: {
      label: "住宅改修",
      keywords: ["住宅", "改修", "手すり", "段差", "玄関", "廊下", "階段", "滑る", "床", "屋内"],
      lens: "Acolclubでは工事を伴わない置き型手すりやスロープを確認できます。固定工事や購入小物は掲載外のため、住宅改修とは分けて検討します。",
      actions: [
        "段差の高さ、廊下幅、置き型手すりを置ける床面、通路の邪魔にならない位置を確認する。",
        "工事なしの手すり・スロープで対応できるか、福祉用具専門相談員へ確認する。",
        "固定工事が必要な場合は、介護保険住宅改修としてケアマネジャーへ相談する。"
      ],
      items: [
        {
          id: "house-rail",
          type: "置き型手すり",
          page: 38,
          pdfPage: 40,
          features: "廊下、玄関、階段周辺、ベッド横などに工事なしの把持点を作る。",
          merits: "よく通る場所で転びにくくなり、自分で動きやすくなる。",
          demerits: "ベースの大きさ、つまずき、床の水平、設置位置を確認する。",
          fit: "決まった場所でふらつく、壁や家具につかまって移動している。",
          triggers: ["手すり", "廊下", "階段", "玄関", "つかまる", "置き型"],
          goals: ["self", "safety"]
        },
        {
          id: "house-slope",
          type: "スロープ",
          page: 76,
          pdfPage: 78,
          features: "小段差や玄関段差に勾配を作り、車輪や足の引っかかりを減らす。",
          merits: "車いす、歩行器、歩行車の動線をつなぎやすい。",
          demerits: "必要長さが取れないと勾配が急になり危険。",
          fit: "段差でつまずく、車輪が止まる、玄関出入りが難しい。",
          triggers: ["段差", "スロープ", "玄関", "つまずく", "車輪"],
          goals: ["safety", "caregiver"]
        },
        {
          id: "house-step",
          type: "ステップ台（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "段差を分割する購入・住宅改修系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "大きな段差を小さくできる場合がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "玄関や浴室入口など、一段が高くて足が上がりにくい。",
          triggers: ["上がり框", "ステップ", "足が上がらない", "高い", "玄関"],
          goals: ["self", "safety"]
        },
        {
          id: "house-grip",
          type: "すべり止め小物・取っ手（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "床面や家具周辺の小物対策。Acolclubレンタルカタログでは掲載外。",
          merits: "小規模な対策として導入しやすい。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "浴室外、廊下、家具周りで滑る・つかみにくい場所がある。",
          triggers: ["滑る", "取っ手", "すべり止め", "小物", "家具"],
          goals: ["safety"]
        }
      ]
    },
    daily: {
      label: "生活支援",
      keywords: ["生活", "立ち上がり", "椅子", "イス", "見守り", "呼び出し", "爪", "リーチャー", "届かない"],
      lens: "Acolclubでは立ち上がりを支える置き型手すりと、離床・徘徊などの見守り機器を確認できます。生活小物やリーチャーは掲載外です。",
      actions: [
        "困っている動作が起こる場所、時間帯、頻度を整理する。",
        "立ち上がり補助は、置き型手すりを置ける床面とつかむ方向を確認する。",
        "見守り機器は、通知先と対応できる時間帯を決めてから選ぶ。"
      ],
      items: [
        {
          id: "daily-stand",
          type: "立ち上がり用置き型手すり",
          page: 50,
          pdfPage: 52,
          features: "椅子やベッド、床から立つ時の把持点を作る。",
          merits: "本人の残存筋力を使いながら介助量を減らしやすい。",
          demerits: "置く場所、床の安定、ベースにつまずかないか確認する。",
          fit: "椅子や布団からの立ち上がりに時間がかかる。",
          triggers: ["立ち上がり", "椅子", "床", "支え", "起立"],
          goals: ["self", "caregiver"]
        },
        {
          id: "daily-reacher",
          type: "リーチャー（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "床の物を拾う購入系生活小物。Acolclubレンタルカタログでは掲載外。",
          merits: "前屈による転倒リスクを下げられる場合がある。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "床の物を拾う、棚の物を取る、前屈でふらつく。",
          triggers: ["届かない", "拾う", "前かがみ", "リーチャー", "腰"],
          goals: ["self", "safety"]
        },
        {
          id: "daily-monitor",
          type: "徘徊感知機器・見守りセンサー",
          page: 86,
          pdfPage: 88,
          features: "離床、徘徊、呼び出しなどを通知する機器を選ぶ。",
          merits: "夜間や別室での見守り負担を減らしやすい。",
          demerits: "誤報、通知先、プライバシー、対応体制を決める必要がある。",
          fit: "夜間離床、転倒不安、呼び出しに気づきにくい。",
          triggers: ["見守り", "夜間", "呼び出し", "センサー", "離床"],
          goals: ["caregiver", "safety"]
        },
        {
          id: "daily-care-tool",
          type: "生活小物（Acolclub掲載外）",
          page: 1,
          pdfPage: 3,
          features: "爪切り、ルーペ、着衣補助などの購入系用品。Acolclubレンタルカタログでは掲載外。",
          merits: "小さな自立動作を残しやすい。",
          demerits: "Acolclub内に該当ページがないため、別カタログ確認が必要。",
          fit: "爪切り、文字読み、包装開封などが難しくなっている。",
          triggers: ["爪", "ルーペ", "はさみ", "見えない", "開ける"],
          goals: ["self"]
        }
      ]
    }
  }
};
