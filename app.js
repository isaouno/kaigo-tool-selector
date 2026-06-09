const state = {
  facts: {
    scene: "",
    ability: "",
    caregiver: "",
    goal: "",
    environment: "",
    desired: ""
  },
  turns: 0,
  recommendations: [],
  pendingFields: [],
  desiredItemIds: [],
  profile: createEmptyProfile(),
  lastSignals: null
};

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");
const quickChipsEl = document.getElementById("quickChips");
const factGridEl = document.getElementById("factGrid");
const progressCountEl = document.getElementById("progressCount");
const pageListEl = document.getElementById("pageList");
const catalogSourceEl = document.getElementById("catalogSource");
const resetButtonEl = document.getElementById("resetButton");
const previewImageEl = document.getElementById("previewImage");
const previewMediaEl = document.getElementById("previewMedia");
const previewPageEl = document.getElementById("previewPage");
const previewTitleEl = document.getElementById("previewTitle");
const previewLinkEl = document.getElementById("previewLink");

const INITIAL_MESSAGE =
  "介護用品えらびサポートです。たくさんある商品の中から、今の生活に合いそうなものを一緒に絞り込みます。\nまず、いちばん困っている場面を下のボタンから選んでください。詳しく書きたい場合は入力欄も使えます。";

const RentalEstimateData = {
  "mob-wheelchair": {
    type: "車いす",
    monthly: [3000, 8000],
    note: "要支援・要介護1は原則対象外。身体状況により例外あり。"
  },
  "mob-wheelchair-cushion": {
    type: "車いす付属品",
    monthly: [1000, 3000],
    note: "車いす本体との適合確認が必要。"
  },
  "bed-care-bed": {
    type: "特殊寝台",
    monthly: [8000, 15000],
    note: "要支援・要介護1は原則対象外。"
  },
  "bed-rail": {
    type: "特殊寝台付属品・手すり",
    monthly: [1000, 4000],
    note: "ベッド固定型か置き型かで扱いが変わる場合あり。"
  },
  "bed-pressure": {
    type: "床ずれ防止用具",
    monthly: [4000, 12000],
    note: "要支援・要介護1は原則対象外。"
  },
  "bed-lift": {
    type: "移動用リフト",
    monthly: [10000, 25000],
    note: "つり具部分は貸与対象外。要支援・要介護1は原則対象外。"
  },
  "mob-slope": {
    type: "スロープ",
    monthly: [2000, 8000],
    note: "工事を伴わないスロープが貸与対象。固定用は販売対象の場合あり。"
  },
  "house-slope": {
    type: "スロープ",
    monthly: [2000, 8000],
    note: "工事を伴わないスロープが貸与対象。固定用は販売対象の場合あり。"
  },
  "mob-walker": {
    type: "歩行器・歩行車",
    monthly: [2000, 5000],
    note: "歩行車は貸与対象。選択制対象の種類は購入との比較説明が必要。"
  },
  "mob-cane": {
    type: "歩行補助つえ",
    monthly: [500, 1500],
    note: "多点杖などが対象。松葉杖は販売対象に含まれる場合あり。"
  },
  "house-rail": {
    type: "手すり",
    monthly: [2000, 8000],
    note: "工事を伴わない置き型手すりが貸与対象。固定工事は住宅改修。"
  },
  "toilet-rail": {
    type: "手すり",
    monthly: [2000, 6000],
    note: "工事を伴わないトイレ用手すりは貸与対象。補高便座は販売対象。"
  },
  "bath-tub-rail": {
    type: "手すり",
    monthly: [2000, 8000],
    note: "工事を伴わない置き型手すりが貸与対象。浴槽内で使える防水用品は別途確認。"
  },
  "bed-transfer-glove": {
    type: "体位変換器",
    monthly: [1000, 4000],
    note: "体位変換や移乗前動作の補助に用いる貸与対象品。"
  },
  "daily-stand": {
    type: "手すり",
    monthly: [2000, 8000],
    note: "工事を伴わない置き型手すりが貸与対象。立ち上がる場所への適合確認が必要。"
  },
  "daily-monitor": {
    type: "認知症老人徘徊感知機器",
    monthly: [3000, 8000],
    note: "離床・徘徊感知用途の機器が対象。単なる通知小物は対象外の場合あり。"
  }
};

const HandsOnCaregiverItemIds = new Set([
  "bath-transfer-board",
  "bath-shower-carry",
  "bed-transfer-glove",
  "bed-lift"
]);

const BathSelfSupportItemIds = new Set([
  "bath-shower-chair",
  "bath-tub-rail",
  "bath-tub-step"
]);

const HandrailAndBathSupportItemIds = new Set([
  "toilet-rail",
  "bath-tub-rail",
  "bath-shower-chair"
]);

const BedRailPreferredItemIds = new Set([
  "bed-rail",
  "daily-stand",
  "house-rail"
]);

const FocusedCompatibleItemIds = {
  "bath-shower-chair": ["bath-shower-chair", "bath-tub-rail", "bath-tub-step"],
  "bath-tub-step": ["bath-tub-step", "bath-tub-rail", "bath-shower-chair"],
  "bath-tub-rail": ["bath-tub-rail", "bath-tub-step", "bath-shower-chair"],
  "bath-transfer-board": ["bath-transfer-board", "bath-tub-rail", "bath-tub-step"],
  "bath-shower-carry": ["bath-shower-carry", "bath-shower-chair", "bath-tub-rail", "bath-tub-step"],
  "toilet-portable": ["toilet-portable", "toilet-rail"],
  "toilet-rail": ["toilet-rail", "toilet-seat"],
  "toilet-seat": ["toilet-seat", "toilet-rail"],
  "toilet-pad": ["toilet-pad", "toilet-clean"],
  "toilet-clean": ["toilet-clean", "toilet-pad"],
  "bed-care-bed": ["bed-care-bed", "bed-rail"],
  "bed-rail": ["bed-rail", "bed-care-bed"],
  "bed-pressure": ["bed-pressure", "bed-transfer-glove"],
  "bed-transfer-glove": ["bed-transfer-glove", "bed-pressure", "bed-rail"],
  "bed-lift": ["bed-lift", "bed-rail", "bed-care-bed"],
  "mob-wheelchair": ["mob-wheelchair", "mob-wheelchair-cushion", "mob-slope"],
  "mob-wheelchair-cushion": ["mob-wheelchair-cushion", "mob-wheelchair"],
  "mob-slope": ["mob-slope", "house-slope", "mob-wheelchair", "mob-walker"],
  "mob-walker": ["mob-walker", "mob-slope"],
  "mob-cane": ["mob-cane"],
  "meal-soft-food": ["meal-soft-food", "meal-thickener"],
  "meal-thickener": ["meal-thickener", "meal-soft-food"],
  "meal-spoon": ["meal-spoon", "meal-dish"],
  "meal-dish": ["meal-dish", "meal-spoon", "meal-apron"],
  "meal-apron": ["meal-apron", "meal-dish"],
  "house-rail": ["house-rail", "daily-stand"],
  "house-slope": ["house-slope", "mob-slope"],
  "house-step": ["house-step", "house-slope", "mob-slope"],
  "house-grip": ["house-grip", "house-rail"],
  "daily-stand": ["daily-stand", "house-rail", "bed-rail"],
  "daily-reacher": ["daily-reacher", "daily-care-tool"],
  "daily-monitor": ["daily-monitor"],
  "daily-care-tool": ["daily-care-tool", "daily-reacher"]
};

function createEmptyProfile() {
  return {
    scenes: [],
    itemIds: [],
    latestItemIds: [],
    abilities: [],
    caregivers: [],
    goals: [],
    environments: [],
    constraints: [],
    lastText: ""
  };
}

function init() {
  renderFacts();
  renderPageList([]);
  addAssistantText(INITIAL_MESSAGE);
  inputEl.focus();
}

function resetConversation() {
  state.facts = {
    scene: "",
    ability: "",
    caregiver: "",
    goal: "",
    environment: "",
    desired: ""
  };
  state.turns = 0;
  state.recommendations = [];
  state.pendingFields = [];
  state.desiredItemIds = [];
  state.profile = createEmptyProfile();
  state.lastSignals = null;
  messagesEl.innerHTML = "";
  quickChipsEl.hidden = false;
  setCatalogPage(CatalogData.meta.defaultPage || 1, CatalogData.meta.defaultPdfPage);
  renderFacts();
  renderPageList([]);
  addAssistantText(INITIAL_MESSAGE);
  inputEl.value = "";
  inputEl.focus();
}

function addAssistantText(text, choices = []) {
  const bubble = document.createElement("article");
  bubble.className = "message assistant";
  const textHtml = text
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
  const choicesHtml = choices.length
    ? `
      <div class="choice-list" role="group" aria-label="回答の選択肢">
        ${choices
          .map(
            (choice) => `
              <button
                type="button"
                data-choice-text="${escapeHtml(choice.value)}"
                data-choice-item-ids="${escapeHtml((choice.itemIds || []).join(","))}"
              >
                ${escapeHtml(choice.label)}
              </button>
            `
          )
          .join("")}
      </div>
    `
    : "";
  bubble.innerHTML = `${textHtml}${choicesHtml}`;
  messagesEl.appendChild(bubble);
  scrollMessages();
}

function addUserText(text) {
  const bubble = document.createElement("article");
  bubble.className = "message user";
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  scrollMessages();
}

function scrollMessages() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function handleUserMessage(rawText, options = {}) {
  const text = rawText.trim();
  if (!text) return;
  addUserText(text);
  quickChipsEl.hidden = true;
  state.turns += 1;
  const pendingFields = [...state.pendingFields];
  const previousHadRecommendation = state.recommendations.length > 0;
  const update = updateFacts(text, pendingFields, options);
  applyPendingAnswerFallback(text, pendingFields);
  renderFacts();

  const missing = getMissingRequiredFacts();
  if (missing.length > 0) {
    const followUp = buildFollowUpQuestion(missing);
    state.pendingFields = followUp.fields;
    addAssistantText(followUp.text, followUp.choices || []);
    return;
  }

  state.pendingFields = [];
  if (previousHadRecommendation && !update.hasMeaningfulChange) {
    addAssistantText(
      "追加したい条件があれば選んでください。文章で補足しても大丈夫です。",
      getAdditionalRequestChoices()
    );
    return;
  }
  const result = buildRecommendation();
  state.recommendations = result.products;
  renderRecommendation(result);
  renderFacts();
  renderPageList(result.products);
  if (result.products[0]) setCatalogPage(result.products[0]);
}

function updateFacts(text, pendingFields = [], options = {}) {
  const beforeFacts = JSON.stringify(state.facts);
  const beforeProfile = JSON.stringify(state.profile);
  const beforeDesiredIds = state.desiredItemIds.join("|");
  const signals = extractMessageSignals(text);
  const desired = applyChoiceItemIds(signals.desired, options.itemIds || options.forcedItemIds || []);
  const nextScene = signals.scene || inferSceneFromItemIds(desired.itemIds);
  if (nextScene && shouldUpdateScene(pendingFields, desired.itemIds, text)) state.facts.scene = nextScene;
  if (nextScene) state.profile.scenes = shouldReplaceFocus(text) ? [nextScene] : promoteIds(state.profile.scenes, [nextScene]);

  const applyDetectedItems = shouldApplyDesiredItems(pendingFields, text, options, desired.itemIds);
  const desiredLabels = applyDetectedItems ? desired.labels : getChoiceItemLabels(options.itemIds || options.forcedItemIds || []);
  const desiredItemIds = applyDetectedItems ? desired.itemIds : options.itemIds || options.forcedItemIds || [];

  if (desiredLabels.length > 0) state.facts.desired = mergeListFact(state.facts.desired, desiredLabels);
  if (desiredItemIds.length > 0) {
    state.desiredItemIds = shouldReplaceFocus(text)
      ? desiredItemIds
      : promoteIds(state.desiredItemIds, desiredItemIds);
    state.profile.itemIds = shouldReplaceFocus(text)
      ? desiredItemIds
      : promoteIds(state.profile.itemIds, desiredItemIds);
    state.profile.latestItemIds = desiredItemIds;
  }

  const ability = signals.ability;
  if (ability) state.facts.ability = mergeFact(state.facts.ability, ability);
  if (ability) state.profile.abilities = mergeProfileValues(state.profile.abilities, splitFactParts(ability));

  const caregiver = signals.caregiver;
  if (caregiver) state.facts.caregiver = mergeFact(state.facts.caregiver, caregiver);
  if (caregiver) state.profile.caregivers = mergeProfileValues(state.profile.caregivers, splitFactParts(caregiver));

  const goal = signals.goal;
  if (goal) state.facts.goal = mergeFact(state.facts.goal, goal);
  if (goal) state.profile.goals = mergeProfileValues(state.profile.goals, splitFactParts(goal));

  const environment = signals.environment;
  if (environment) state.facts.environment = mergeFact(state.facts.environment, environment);
  if (environment) state.profile.environments = mergeProfileValues(state.profile.environments, splitFactParts(environment));
  if (signals.constraints.length > 0) state.profile.constraints = mergeProfileValues(state.profile.constraints, signals.constraints);
  state.profile.lastText = text;
  state.lastSignals = signals;

  return {
    hasMeaningfulChange:
      beforeFacts !== JSON.stringify(state.facts) ||
      beforeProfile !== JSON.stringify(state.profile) ||
      beforeDesiredIds !== state.desiredItemIds.join("|"),
    desiredItemIds,
    scene: nextScene
  };
}

function applyChoiceItemIds(desired, itemIds = []) {
  const choiceItemIds = itemIds.filter(Boolean);
  if (choiceItemIds.length === 0) return desired;
  return {
    labels: mergeIds(desired.labels, getChoiceItemLabels(choiceItemIds)),
    itemIds: promoteIds(desired.itemIds, choiceItemIds)
  };
}

function getChoiceItemLabels(itemIds = []) {
  return itemIds
    .map((itemId) => findCatalogItemById(itemId)?.type)
    .filter(Boolean);
}

function shouldApplyDesiredItems(pendingFields, text, options, itemIds) {
  const forcedItemIds = options.itemIds || options.forcedItemIds || [];
  if (forcedItemIds.length > 0) return true;
  if (itemIds.length === 0) return false;
  if (pendingFields.includes("scene") || pendingFields.includes("ability")) return true;
  if (!pendingFields.includes("caregiver") && !pendingFields.includes("goal")) return true;
  return isExplicitProductRequest(text);
}

function isExplicitProductRequest(text) {
  const normalized = normalize(text);
  return hasAny(normalized, ["ほしい", "欲しい", "見たい", "気になる", "検討したい", "確認したい", "使いたい", "追加"]);
}

function extractMessageSignals(text) {
  const scene = detectScene(text);
  const desired = detectDesiredItems(text);
  const activeScene = scene || inferSceneFromItemIds(desired.itemIds) || state.facts.scene;
  return {
    text,
    scene,
    desired,
    ability: detectAbility(text, activeScene),
    caregiver: detectCaregiver(text),
    goal: detectGoal(text),
    environment: detectEnvironment(text),
    constraints: detectConstraints(text)
  };
}

function shouldUpdateScene(pendingFields, desiredItemIds, text) {
  if (!state.facts.scene || pendingFields.includes("scene")) return true;
  if (state.recommendations.length === 0) return desiredItemIds.length > 0 && isSceneSwitchRequest(text);
  return desiredItemIds.length > 0 || isSceneSwitchRequest(text);
}

function mergeFact(current, next) {
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}。${next}`;
}

function mergeListFact(current, nextItems) {
  const currentItems = current ? current.split("、").filter(Boolean) : [];
  return [...new Set([...currentItems, ...nextItems])].slice(0, 6).join("、");
}

function mergeIds(current, nextIds) {
  return [...new Set([...current, ...nextIds])];
}

function promoteIds(current, priorityIds) {
  return [...new Set([...priorityIds, ...current])];
}

function mergeProfileValues(current, nextValues) {
  return [...new Set([...current, ...nextValues])].slice(0, 10);
}

function splitFactParts(value) {
  return value.split("。").map((part) => part.trim()).filter(Boolean);
}

function shouldReplaceFocus(text) {
  const normalized = normalize(text);
  return hasAny(normalized, ["ではなく", "じゃなく", "やめ", "変更", "切り替え", "今度は", "次は", "別の"]);
}

function isSceneSwitchRequest(text) {
  const normalized = normalize(text);
  return hasAny(normalized, ["今度は", "次は", "別の", "追加", "も見", "見たい", "も検討", "欲しい", "ほしい", "相談したい"]);
}

function detectScene(text) {
  const normalized = normalize(text);
  if (hasDailyMonitorRequest(normalized)) return "daily";
  if (hasBathWashingSupportRequest(normalized) || hasBathTubEntryRequest(normalized)) return "bath";
  let bestScene = "";
  let bestScore = 0;
  for (const [sceneKey, scene] of Object.entries(CatalogData.scenes)) {
    const score = scene.keywords.reduce((total, keyword) => {
      return normalized.includes(normalize(keyword)) ? total + 1 : total;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestScene = sceneKey;
    }
  }
  return bestScene;
}

function hasBathWashingSupportRequest(normalized) {
  return (
    hasAny(normalized, ["洗い場", "洗身", "洗髪", "体を洗", "身体を洗", "シャワー"]) &&
    hasAny(normalized, ["立つと不安", "立って", "立つ時", "ふらつ", "座って", "椅子", "いす", "イス", "チェア"])
  );
}

function hasBathTubEntryRequest(normalized) {
  return (
    hasAny(normalized, ["浴槽", "湯船", "お風呂", "風呂"]) &&
    hasAny(normalized, ["またぐ", "またぎ", "出入り", "入る", "出る", "段差", "高さ", "手すり", "支え", "つかま", "浴槽台", "すのこ"])
  );
}

function hasPortableToiletRequest(normalized) {
  return (
    hasAny(normalized, ["ポータブルトイレ", "ポータブル便器"]) ||
    (hasAny(normalized, ["夜間", "夜", "寝室", "ベッド"]) &&
      hasAny(normalized, ["トイレ", "排泄"]) &&
      hasAny(normalized, ["間に合わ", "遠い", "行けない", "不安", "近く"]))
  );
}

function hasToiletSeatHeightRequest(normalized) {
  return (
    hasAny(normalized, ["便座", "トイレ"]) &&
    hasAny(normalized, ["低い", "高さ", "補高", "膝", "ひざ", "腰", "立ち上がりにく", "立ちにく"])
  );
}

function hasToiletRailRequest(normalized) {
  return (
    hasAny(normalized, ["トイレ", "便座", "便器", "排泄"]) &&
    hasAny(normalized, ["手すり", "支え", "つかま", "立ち座り", "立つ", "座る", "方向転換", "ふらつ"])
  );
}

function hasDailyMonitorRequest(normalized) {
  return (
    hasAny(normalized, ["見守り", "センサー", "通知", "呼び出し", "離床", "徘徊", "報知"]) &&
    !hasAny(normalized, ["立ち上がり補助", "手すりが欲しい"])
  );
}

function hasBedContext(normalized) {
  return hasAny(normalized, [
    "ベッド",
    "ベット",
    "寝台",
    "ベッド周囲",
    "ベッド周り",
    "ベッド横",
    "ベッドサイド",
    "寝室",
    "起き上がり",
    "端座位"
  ]);
}

function hasBedSupportRequest(normalized) {
  const supportTerms = [
    "手すり",
    "支え",
    "つかまる",
    "掴まる",
    "つかまれる",
    "つかむ",
    "把持",
    "サイドレール",
    "サポートグリップ",
    "介助バー",
    "ベッド用手すり",
    "立ち上がり",
    "起き上がり"
  ];
  const otherLocations = ["トイレ", "便座", "排泄", "浴室", "浴槽", "入浴", "風呂", "お風呂", "シャワー", "玄関", "廊下", "階段"];
  return (
    hasAny(normalized, supportTerms) &&
    (hasBedContext(normalized) || (!hasAny(normalized, otherLocations) && state.facts.scene === "bed"))
  );
}

function hasWheelchairTransferSupportContext(normalized) {
  return (
    hasAny(normalized, ["車いす", "車椅子", "車イス"]) &&
    hasAny(normalized, ["ベッド", "ベット", "寝台"]) &&
    hasAny(normalized, ["移る", "乗り移", "移乗", "横付け", "移す"]) &&
    hasAny(normalized, ["手すり", "支え", "つかま", "掴ま", "把持", "サイドレール", "介助バー"])
  );
}

function hasExplicitWheelchairUseRequest(normalized) {
  if (hasWheelchairTransferSupportContext(normalized)) return false;
  if (
    hasAny(normalized, ["車いす", "車椅子", "車イス"]) &&
    hasAny(normalized, ["欲しい", "ほしい", "見たい", "検討", "確認", "使いたい", "利用したい", "必要", "追加"])
  ) {
    return true;
  }
  return hasAny(normalized, ["通院", "外出", "長距離"]) && hasAny(normalized, ["歩けない", "歩くのが難しい", "車いす", "車椅子", "車イス"]);
}

function hasLatestExplicitWheelchairUseRequest() {
  return hasExplicitWheelchairUseRequest(normalize(state.profile.lastText || ""));
}

function hasStrongLiftNeed(normalized) {
  return hasAny(normalized, [
    "リフト",
    "吊り具",
    "つり具",
    "抱え上げ",
    "抱えあげ",
    "抱える介助",
    "体を持ち上げ",
    "持ち上げる",
    "全介助",
    "立てない",
    "立位保持ができない",
    "腰痛",
    "腰への負担"
  ]);
}

function detectDesiredItems(text) {
  const normalized = normalize(text);
  const matches = [];
  const itemIds = [];

  if (normalized.includes("手すり")) {
    if (hasBedSupportRequest(normalized)) itemIds.push("bed-rail");
    if (hasToiletRailRequest(normalized)) itemIds.push("toilet-rail");
    if (hasAny(normalized, ["浴室", "浴槽", "入浴", "風呂", "お風呂", "シャワー"])) itemIds.push("bath-tub-rail");
    if (hasAny(normalized, ["玄関", "廊下", "階段", "住宅", "屋内", "家"])) itemIds.push("house-rail");
  }
  if (hasBathWashingSupportRequest(normalized)) {
    itemIds.push("bath-shower-chair");
  }
  if (hasBathTubEntryRequest(normalized)) {
    itemIds.push("bath-tub-rail", "bath-tub-step");
  }
  if (hasPortableToiletRequest(normalized)) {
    itemIds.push("toilet-portable");
  }
  if (hasToiletSeatHeightRequest(normalized)) {
    itemIds.push("toilet-seat");
  }
  if (hasToiletRailRequest(normalized)) {
    itemIds.push("toilet-rail");
  }
  if (hasDailyMonitorRequest(normalized)) {
    itemIds.push("daily-monitor");
  }
  if (hasBedSupportRequest(normalized)) {
    itemIds.push("bed-rail");
  }
  if (hasStrongLiftNeed(normalized)) {
    itemIds.push("bed-lift");
  }
  if (hasAny(normalized, ["シャワーチェア", "シャワー椅子", "シャワーいす", "風呂椅子", "風呂いす"])) {
    itemIds.push("bath-shower-chair");
  }
  if (hasAny(normalized, ["歩行器", "歩行車", "歩行補助車", "シルバーカー"])) {
    itemIds.push("mob-walker");
  }
  if (hasAny(normalized, ["両手でしっかり支え", "両手で支え", "両手の支え", "両手支持", "休憩しながら歩", "外出中に疲れやす"])) {
    itemIds.push("mob-walker");
  }
  if (hasAny(normalized, ["片手の支え", "片手で支え", "片手支持", "短い距離なら歩け", "杖", "多点杖", "一本杖", "つえ"])) {
    itemIds.push("mob-cane");
  }
  if (hasExplicitWheelchairUseRequest(normalized)) {
    itemIds.push("mob-wheelchair");
  }
  if (hasAny(normalized, ["椅子や床から立ち上がり", "椅子から立ち上がり", "床から立ち上がり", "立ち上がり補助", "立ち上がり用"])) {
    itemIds.push("daily-stand");
  }
  if (hasAny(normalized, ["とろみ", "むせる", "むせ", "嚥下", "飲み込み", "水分ゼリー"])) {
    itemIds.push("meal-thickener");
  }
  if (hasAny(normalized, ["介護食", "やわらか食", "やわらかい食事", "噛めない", "噛みにくい", "ミキサー食"])) {
    itemIds.push("meal-soft-food");
  }
  if (hasAny(normalized, ["スプーン", "フォーク", "箸", "はし", "口に運ぶ", "口へ運ぶ"])) {
    itemIds.push("meal-spoon");
  }
  if (hasAny(normalized, ["食器", "皿", "茶碗", "すべり止め", "滑り止め", "こぼす", "こぼれる"])) {
    itemIds.push("meal-dish");
  }
  if (hasAny(normalized, ["エプロン", "食べこぼし", "服が汚れる", "衣類が汚れる", "洗濯"])) {
    itemIds.push("meal-apron");
  }

  for (const scene of Object.values(CatalogData.scenes)) {
    for (const item of scene.items) {
      const words = [item.type, ...item.type.split(/[・/／]/).filter(Boolean)];
      if (item.type.includes("車いす")) words.push("車椅子");
      if (
        item.id === "daily-monitor" &&
        normalized.includes("見守り") &&
        !hasAny(normalized, ["センサー", "報知", "呼び出し", "離床", "夜間", "電話", "通知", "別室"])
      ) {
        continue;
      }
      if (item.id === "mob-wheelchair" && !hasExplicitWheelchairUseRequest(normalized)) continue;
      if (item.id === "bed-lift" && !hasStrongLiftNeed(normalized)) continue;
      if (words.some((word) => normalized.includes(normalize(word)))) {
        matches.push(item.type);
        itemIds.push(item.id);
      }
    }
  }
  for (const [itemId, products] of Object.entries(getCatalogProducts())) {
    for (const product of products) {
      const words = [product.maker, product.name, product.model].filter((word) => normalize(word).length >= 3);
      if (words.some((word) => normalized.includes(normalize(word)))) {
        matches.push(product.name);
        itemIds.push(itemId);
      }
    }
  }
  for (const itemId of itemIds) {
    const item = findCatalogItemById(itemId);
    if (item) matches.push(item.type);
  }
  return {
    labels: [...new Set(matches)].slice(0, 6),
    itemIds: [...new Set(itemIds)]
  };
}

function detectAbility(text, sceneKey = "") {
  const normalized = normalize(text);
  const facts = [];
  if (sceneKey === "meal" || hasAny(normalized, ["食事", "食べ", "飲み", "むせ", "嚥下", "スプーン", "箸", "皿", "エプロン"])) {
    if (hasAny(normalized, ["むせ", "咳き込", "嚥下", "飲み込み", "水分", "お茶", "誤嚥"])) {
      facts.push("水分や食べ物でむせやすく、飲み込みやすさの確認が必要");
    }
    if (hasAny(normalized, ["噛めない", "噛みにく", "かみにく", "やわらか", "普通食", "食べづら", "ミキサー"])) {
      facts.push("噛む力や食べ物の形が合っているか確認が必要");
    }
    if (hasAny(normalized, ["スプーン", "フォーク", "箸", "はし", "握れ", "手が動", "片手", "口に運", "口へ運"])) {
      facts.push("手や指の動きに合わせて、食具の持ちやすさを確認する必要がある");
    }
    if (hasAny(normalized, ["こぼ", "皿", "食器", "茶碗", "すべ", "滑", "エプロン", "汚れ"])) {
      facts.push("食べこぼしや食器の動きに対する工夫が必要");
    }
    if (hasAny(normalized, ["姿勢", "傾く", "座位", "首", "体が倒", "食事姿勢"])) {
      facts.push("食事中の姿勢が崩れやすく、座り方や食器位置の確認が必要");
    }
  }
  if (hasAny(normalized, ["立てない", "立ち上がれない", "歩けない", "寝たきり", "全介助"])) {
    facts.push("立つ・歩く・乗り移る動きに手伝いが必要");
  }
  if (hasAny(normalized, ["ふらつ", "転倒", "不安定", "怖い", "危ない"])) {
    facts.push("立つ・歩く・向きを変える時にふらつきがあり、転ばない工夫が必要");
  }
  if (hasAny(normalized, ["両手", "支えれば歩け", "支えがあれば歩け", "歩行車"])) {
    facts.push("両手で支えれば歩けるため、歩く時の支え方を合わせる必要がある");
  }
  if (hasAny(normalized, ["疲れやす", "長距離", "休憩", "休みながら"])) {
    facts.push("長く歩くと疲れやすく、途中で休める工夫が必要");
  }
  if (hasAny(normalized, ["座れる", "座位", "座って"])) {
    facts.push("座っていることはある程度できる");
  }
  if (hasAny(normalized, ["車いす", "車椅子"])) {
    facts.push("車いすを使うため、乗り移りや通路の広さの確認が必要");
  }
  if (hasAny(normalized, ["片麻痺", "麻痺", "右半身", "左半身"])) {
    facts.push("体の左右で動かしやすさに差があり、支える位置の確認が必要");
  }
  if (hasAny(normalized, ["自力", "自分で", "一人で", "ひとりで"])) {
    facts.push("できるところはご本人が自分でしたい");
  }
  if (hasAny(normalized, ["膝", "腰", "痛い", "疼痛"])) {
    facts.push("膝や腰などの痛みで、立つ・座る動きがつらくなりやすい");
  }
  return facts.slice(0, 3).join("。");
}

function detectCaregiver(text) {
  const normalized = normalize(text);
  const facts = [];
  if (hasAny(normalized, ["1人", "1名", "一人", "一名", "ひとり", "家族1", "家族一", "ワンオペ"])) {
    facts.push("手伝う人は主に1人");
  }
  if (hasAny(normalized, ["2人", "二人", "ふたり", "職員", "ヘルパー"])) {
    facts.push("複数人、またはヘルパーなどが手伝う場面がある");
  }
  if (hasAny(normalized, ["腰痛", "腰が痛", "負担", "大変", "重い", "抱え"])) {
    facts.push("手伝う人の腰や体への負担が大きい");
  }
  if (hasAny(normalized, ["高齢", "母が介助", "父が介助", "妻が介助", "夫が介助"])) {
    facts.push("手伝う人の体力にも配慮が必要");
  }
  if (hasAny(normalized, ["独り", "独居", "不在", "日中独り", "日中は独り", "夜間", "眠って", "寝ている"])) {
    facts.push("手伝う人がいない、またはすぐ対応しにくい時間帯がある");
  }
  return facts.slice(0, 3).join("。");
}

function detectGoal(text) {
  const normalized = normalize(text);
  const facts = [];
  if (hasAny(normalized, ["自立", "自分で", "できるだけ本人", "一人で", "ひとりで"])) {
    facts.push("できるだけご本人が自分でできるようにしたい");
  }
  if (hasAny(normalized, ["負担軽減", "楽に", "介助を減ら", "腰痛", "大変", "抱え"])) {
    facts.push("手伝う人の負担を減らしたい");
  }
  if (hasAny(normalized, ["安全", "転倒", "怖い", "危ない", "ふらつ"])) {
    facts.push("転ばない・危なくないことを大事にしたい");
  }
  if (hasAny(normalized, ["安い", "価格", "費用", "レンタル", "購入"])) {
    facts.push("費用、レンタル、購入方法も確認したい");
  }
  return facts.slice(0, 2).join("。");
}

function detectEnvironment(text) {
  const normalized = normalize(text);
  const facts = [];
  if (hasAny(normalized, ["狭い", "幅", "スペース", "置けない"])) {
    facts.push("置く場所の広さに余裕が少ない");
  }
  if (hasAny(normalized, ["段差", "玄関", "階段", "廊下"])) {
    facts.push("段差や家の中の通り道を確認する必要がある");
  }
  if (hasAny(normalized, ["賃貸", "工事できない", "穴を開けられない"])) {
    facts.push("壁や床に穴を開ける工事は難しい可能性がある");
  }
  return facts.slice(0, 2).join("。");
}

function detectConstraints(text) {
  const normalized = normalize(text);
  const constraints = [];
  if (hasAny(normalized, ["狭い", "小さい", "コンパクト", "省スペース", "置けない", "幅"])) {
    constraints.push("コンパクトさ・設置スペース重視");
  }
  if (hasAny(normalized, ["安い", "価格", "費用", "予算", "高い", "抑えたい"])) {
    constraints.push("費用を抑えたい");
  }
  if (hasAny(normalized, ["レンタル", "借りる", "試用", "デモ"])) {
    constraints.push("レンタル・試用を確認したい");
  }
  if (hasAny(normalized, ["軽い", "軽量", "持ち運び", "車に積む", "折りたたみ"])) {
    constraints.push("軽さ・持ち運び重視");
  }
  if (hasAny(normalized, ["夜間", "夜", "寝ている", "一人", "独り"])) {
    constraints.push("夜間や一人の時間帯に配慮");
  }
  return constraints;
}

function hasAny(text, words) {
  return words.some((word) => text.includes(normalize(word)));
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "");
}

function getCatalogProducts() {
  return typeof CatalogProducts === "undefined" ? {} : CatalogProducts;
}

function productSearchTerms(product) {
  return [product.maker, product.name, product.model, product.category, ...(product.keywords || [])].filter(Boolean);
}

function productTitle(product) {
  const maker = cleanDisplayText(product.maker);
  const name = cleanDisplayText(product.name || product.type || "候補商品");
  return `${maker ? `${maker} ` : ""}${name}`;
}

function productSubText(product) {
  const parts = [];
  if (product.model) parts.push(`型番: ${product.model}`);
  if (product.price) parts.push(`価格: ${product.price}`);
  return parts.join(" / ");
}

function productPageLabel(product) {
  return cleanDisplayText(product.name || product.type || product.category || "候補");
}

function cleanDisplayText(value = "") {
  return String(value)
    .replace(/Acolclub掲載外/g, "")
    .replace(/（\s*）/g, "")
    .replace(/はAcolclubレンタルカタログ掲載外/g, "")
    .replace(/Acolclubレンタルカタログ掲載外/g, "")
    .replace(/レンタルカタログ掲載外/g, "")
    .replace(/このAcolclubカタログには該当商品の掲載がありません。/g, "")
    .replace(/Acolclub内では該当商品にリンクしません。/g, "")
    .replace(/Acolclub内では該当商品にリンクせず、/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCatalogPage(target, pdfPage) {
  const pageMap = CatalogData.meta.pageMap || {};
  if (target && typeof target === "object") {
    const page = target.page;
    return {
      page,
      pdfPage: target.pdfPage || pageMap[page] || page
    };
  }
  const page = Number(target) || target;
  return {
    page,
    pdfPage: pdfPage || pageMap[page] || page
  };
}

function catalogPageHref(target, pdfPage) {
  const pageInfo = resolveCatalogPage(target, pdfPage);
  return pageInfo.pdfPage ? `${CatalogData.meta.pdf}#page=${pageInfo.pdfPage}` : CatalogData.meta.pdf;
}

function renderProductCost(product) {
  const rental = getRentalEstimate(product);
  const nonRentalNote = renderNonRentalCostNote(product);
  return `
    <span class="product-price">価格: ${escapeHtml(product.price || "カタログ確認")}</span>
    ${
      rental
        ? `
          <div class="rental-cost">
            <strong>介護保険レンタル対象</strong>
            <span>月額目安: ${escapeHtml(formatRentalRange(rental.monthly, 1))}（1割） / ${escapeHtml(formatRentalRange(rental.monthly, 2))}（2割） / ${escapeHtml(formatRentalRange(rental.monthly, 3))}（3割）</span>
            <small>${escapeHtml(rental.type)}。${escapeHtml(rental.note)} 実際の貸与価格は事業所・地域で変わります。</small>
          </div>
        `
        : `<small class="cost-note">${escapeHtml(nonRentalNote)}</small>`
    }
  `;
}

function renderNonRentalCostNote(product) {
  const insurance = product.insurance || getCategoryDecisionMeta(product.categoryId).insurance || {};
  if (insurance.purchase && insurance.privatePay) {
    return "介護保険では購入・住宅改修・自費扱いになる場合があります。購入対象・自費対象として事業所へ確認してください。";
  }
  if (insurance.purchase) {
    return "介護保険では購入対象になる場合があります。自己負担や対象条件を事業所へ確認してください。";
  }
  return "介護保険では購入・住宅改修・自費扱いになる場合があります。";
}

function getRentalEstimate(product) {
  const base = RentalEstimateData[product.categoryId];
  if (!base) return null;
  if (product.categoryId === "toilet-rail" && hasAny(normalize(product.name), ["サニタリエース"])) return null;
  if (product.categoryId === "daily-monitor" && !hasAny(normalize(product.name), ["センサー", "見守りセンサー"])) return null;
  return base;
}

function formatRentalRange(monthlyRange, burdenRate) {
  const [min, max] = monthlyRange.map((amount) => Math.round((amount * burdenRate) / 10 / 10) * 10);
  return `${formatYen(min)}〜${formatYen(max)}/月`;
}

function formatYen(value) {
  return `${Number(value).toLocaleString("ja-JP")}円`;
}

function findCatalogItemById(itemId) {
  for (const scene of Object.values(CatalogData.scenes)) {
    const item = scene.items.find((candidate) => candidate.id === itemId);
    if (item) return item;
  }
  return null;
}

function findSceneKeyByItemId(itemId) {
  for (const [sceneKey, scene] of Object.entries(CatalogData.scenes)) {
    if (scene.items.some((item) => item.id === itemId)) return sceneKey;
  }
  return "";
}

function inferSceneFromItemIds(itemIds) {
  for (const itemId of itemIds) {
    const sceneKey = findSceneKeyByItemId(itemId);
    if (sceneKey) return sceneKey;
  }
  return "";
}

function getMissingRequiredFacts() {
  const required = ["scene", "ability", "caregiver", "goal", "environment"];
  return required.filter((field) => !state.facts[field]);
}

const SceneFollowUpQuestions = {
  bath: {
    ability:
      "お風呂で困っている動きに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "お風呂の手伝いをする人の状況に近いものを選んでください。"
  },
  toilet: {
    ability:
      "トイレで困っている動きに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "トイレの手伝いをする人の状況に近いものを選んでください。"
  },
  bed: {
    ability:
      "ベッド周りで困っている動きに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "ベッド周りの手伝いをする人の状況に近いものを選んでください。"
  },
  mobility: {
    ability:
      "移動や歩行で困っていることに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "移動の手伝いをする人の状況に近いものを選んでください。"
  },
  meal: {
    ability:
      "食べる場面で困っていることに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "食事の手伝いをする人の状況に近いものを選んでください。"
  },
  housing: {
    ability:
      "家の中で困っている場所や動きに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "家の中の移動や動作を手伝う人の状況に近いものを選んでください。"
  },
  daily: {
    ability:
      "毎日の生活で困っている動作に近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。",
    caregiver:
      "生活の手伝いをする人の状況に近いものを選んでください。"
  }
};

function getSceneFollowUp(kind, fallbackText) {
  return SceneFollowUpQuestions[state.facts.scene]?.[kind] || fallbackText;
}

const SceneAbilityChoices = {
  bath: [
    { label: "洗い場で立つと不安", value: "洗い場で立つとふらつきます。座って体を洗いたいです。", itemIds: ["bath-shower-chair"] },
    { label: "浴槽をまたぐのが不安", value: "浴槽をまたぐ時につかまる場所がほしいです。浴槽手すりや浴槽台を検討したいです。", itemIds: ["bath-tub-rail", "bath-tub-step"] },
    { label: "浴室内の移動が難しい", value: "浴室まで歩くことや、浴室内で移動することが難しいです。", itemIds: ["bath-shower-carry"] },
    { label: "座ってシャワー中心にしたい", value: "浴槽に入るより、座ってシャワー浴を中心にしたいです。シャワーチェアがほしいです。", itemIds: ["bath-shower-chair"] },
    { label: "浴槽内で立つ・座るのが不安", value: "浴槽の中で立つ時や座る時が不安です。浴槽台やすのこを確認したいです。", itemIds: ["bath-tub-step"] },
    { label: "体を支えて洗う介助が大変", value: "体を支えながら洗う介助が大変です。手伝う人の負担を減らしたいです。", itemIds: ["bath-shower-chair"] }
  ],
  toilet: [
    { label: "便座に座る・立つ時が不安", value: "便座に座る時や立つ時にふらつきます。トイレ用手すりや補高便座を確認したいです。", itemIds: ["toilet-rail", "toilet-seat"] },
    { label: "夜に間に合わない", value: "夜間にトイレまで間に合わないことがあります。ポータブルトイレも検討したいです。", itemIds: ["toilet-portable"] },
    { label: "向きを変える・服の上げ下げが大変", value: "トイレで向きを変える時や、ズボンを上げ下げする時に支えが必要です。", itemIds: ["toilet-rail"] },
    { label: "尿もれ・パッド交換で困る", value: "尿もれやパッド交換で困っています。尿とりパッドや紙おむつを確認したいです。", itemIds: ["toilet-pad"] },
    { label: "便座が低く立ち上がりにくい", value: "便座が低く、膝や腰がつらくて立ち上がりにくいです。補高便座も確認したいです。", itemIds: ["toilet-seat"] },
    { label: "後始末や清拭が大変", value: "排泄後に拭くことや清潔を保つことが大変です。おしりふきや洗浄用品も確認したいです。", itemIds: ["toilet-clean"] }
  ],
  bed: [
    { label: "起き上がりが大変", value: "ベッドから起き上がる時に支えが必要です。ベッド用手すりがほしいです。", itemIds: ["bed-rail"] },
    { label: "ベッド横で立ち上がる時につかまる場所がほしい", value: "ベッド横で立ち上がる時につかまる場所がほしいです。ベッド用手すりや介助バーを確認したいです。", itemIds: ["bed-rail"] },
    { label: "椅子・車いすへ移る時につかまる場所がほしい", value: "ベッドから椅子や車いすへ移る時につかまる場所がほしいです。ベッド用手すりを確認したいです。", itemIds: ["bed-rail"] },
    { label: "寝返り・体の向き替えが大変", value: "寝返りや体の向きを変えることが難しいです。床ずれも心配です。", itemIds: ["bed-pressure"] },
    { label: "抱え上げる移乗介助が大変", value: "ベッドから車いすや椅子へ移る時に抱え上げる介助が続いています。リフトも検討したいです。", itemIds: ["bed-lift"] },
    { label: "皮膚の赤み・床ずれが心配", value: "長く寝ていることが多く、皮膚の赤みや床ずれが心配です。", itemIds: ["bed-pressure"] },
    { label: "ベッドの高さを合わせたい", value: "ベッドの高さが合わず、起き上がりや介助が大変です。介護ベッドを確認したいです。", itemIds: ["bed-care-bed"] },
    { label: "抱え上げる介助が続いている", value: "抱え上げる介助が続いていて、手伝う人の腰への負担が大きいです。リフトも検討したいです。", itemIds: ["bed-lift"] }
  ],
  mobility: [
    { label: "家の中でふらつく", value: "家の中は歩けますが、ふらつきがあり転倒が不安です。", itemIds: ["mob-cane"] },
    { label: "外出中に疲れやすい", value: "外出中に疲れやすく、休憩しながら歩きたいです。歩行車が気になります。", itemIds: ["mob-walker"] },
    { label: "通院・長距離は車いす", value: "通院や長い距離の移動は歩くのが難しいです。車いすを使いたいです。", itemIds: ["mob-wheelchair"] },
    { label: "玄関や段差で困る", value: "玄関や家の中の段差で困っています。スロープも検討したいです。", itemIds: ["mob-slope"] },
    { label: "片手の支えで歩きたい", value: "短い距離なら歩けますが、片手で支えがほしいです。杖や多点杖を確認したいです。", itemIds: ["mob-cane"] },
    { label: "両手でしっかり支えたい", value: "両手でしっかり支えれば歩けそうです。歩行器や歩行車を確認したいです。", itemIds: ["mob-walker"] }
  ],
  meal: [
    { label: "むせる・飲み込みが不安", value: "食事中にむせることがあります。飲み込みが不安で、とろみも検討したいです。", itemIds: ["meal-thickener"] },
    { label: "噛みにくい・食べづらい", value: "普通の食事が噛みにくく、食べづらいです。やわらかい介護食を確認したいです。", itemIds: ["meal-soft-food"] },
    { label: "スプーンや箸が使いにくい", value: "スプーンや箸が使いにくく、口へ運ぶ動きに手伝いが必要です。", itemIds: ["meal-spoon"] },
    { label: "皿が動く・こぼす", value: "皿が動いたり、食べこぼしが多かったりして困っています。食器やすべり止めを確認したいです。", itemIds: ["meal-dish"] },
    { label: "服が汚れる", value: "食べこぼしで服が汚れます。食事用エプロンを確認したいです。", itemIds: ["meal-apron"] },
    { label: "姿勢が崩れやすい", value: "食事中に姿勢が崩れやすく、食べる姿勢の調整が必要です。", itemIds: ["meal-dish"] },
    { label: "水分を取りにくい", value: "水分を取りにくく、飲み込みやすい水分補給の方法を確認したいです。", itemIds: ["meal-thickener"] }
  ],
  housing: [
    { label: "玄関・廊下に支えがほしい", value: "玄関や廊下でふらつきます。住宅用手すりがほしいです。", itemIds: ["house-rail"] },
    { label: "段差でつまずく", value: "段差でつまずきます。段差解消スロープを検討したいです。", itemIds: ["house-slope"] },
    { label: "階段が不安", value: "階段や廊下でふらつきがあり、転倒が不安です。", itemIds: ["house-rail"] },
    { label: "工事せず置き型で考えたい", value: "賃貸なので工事できないです。置き型の手すりやスロープで考えたいです。", itemIds: ["house-rail", "house-slope"] },
    { label: "浴室やトイレに手すりがほしい", value: "浴室やトイレに手すりがほしいです。使う場所に合う手すりを確認したいです。", itemIds: ["bath-tub-rail", "toilet-rail"] },
    { label: "床がすべる・つかみにくい", value: "床がすべったり、家具まわりでつかみにくかったりして転倒が不安です。", itemIds: ["house-grip"] }
  ],
  daily: [
    { label: "椅子や床から立ち上がりにくい", value: "椅子や床から立ち上がる時に支えが必要です。立ち上がり補助を確認したいです。", itemIds: ["daily-stand"] },
    { label: "夜間や別室の見守りが心配", value: "夜間や別室にいる時の見守りが心配です。見守りセンサーを検討したいです。", itemIds: ["daily-monitor"] },
    { label: "床の物を拾う・棚に届かない", value: "床の物を拾うことや、棚の物を取ることが難しいです。リーチャーを確認したいです。", itemIds: ["daily-reacher"] },
    { label: "爪切りや細かい作業が難しい", value: "爪切りや細かい作業が難しいです。使いやすい生活小物を確認したいです。", itemIds: ["daily-care-tool"] },
    { label: "呼び出しに気づきにくい", value: "呼び出しに気づきにくく、知らせる道具を確認したいです。", itemIds: ["daily-monitor"] },
    { label: "毎日くり返す小さな動作が大変", value: "毎日くり返す小さな動作が大変です。生活を助ける道具を広めに確認したいです。", itemIds: ["daily-care-tool"] }
  ]
};

const CaregiverChoices = {
  default: [
    { label: "主に1人で手伝う", value: "手伝う人は主に1人です。" },
    { label: "2人以上・ヘルパーも関わる", value: "手伝う人は2人以上、またはヘルパーも関わります。" },
    { label: "腰や体の負担が大きい", value: "手伝う人の腰や体への負担が大きいです。" },
    { label: "夜や外出時が大変", value: "夜間や外出時など、手伝いにくい時間帯があります。" },
    { label: "本人だけの時間が多い", value: "日中や夜間に本人だけになる時間が多いです。" },
    { label: "見守り中心で手伝う", value: "直接手伝うより、見守りや声かけが中心です。" }
  ],
  meal: [
    { label: "主に1人で付き添う", value: "食事の手伝いは主に1人です。そばで確認や声かけをしています。" },
    { label: "口へ運ぶ介助が大変", value: "口へ運ぶ介助が大変です。手伝う人の負担を減らしたいです。" },
    { label: "準備・片付けが大変", value: "食事の準備や片付け、洗濯の負担が大きいです。" },
    { label: "食事中ずっと付き添う", value: "食事中はずっと付き添いが必要で、手伝う人の負担が大きいです。" },
    { label: "むせないか確認している", value: "食事中にむせないか、そばで確認する必要があります。" },
    { label: "本人だけで食べる時間がある", value: "本人だけで食べる時間があり、安全面が心配です。" }
  ]
};

const GoalChoices = [
  { label: "本人が自分でできる", value: "できるだけ本人が自分でできるようにしたいです。" },
  { label: "手伝う人を楽にする", value: "手伝う人の負担を減らしたいです。" },
  { label: "転倒や事故を防ぐ", value: "安全を優先して、転倒や事故を防ぎたいです。" },
  { label: "費用・レンタルも確認", value: "費用やレンタルできるかも確認したいです。" }
];

const EnvironmentChoices = [
  { label: "広さはおおむね確保できる", value: "置く場所の広さはおおむね確保できています。" },
  { label: "狭い・置けるか不安", value: "置く場所が狭いので、コンパクトなものがよいです。" },
  { label: "段差や通路幅が不安", value: "段差や通路幅があり、家の中の通り道を確認する必要があります。" },
  { label: "工事は難しい", value: "賃貸などの理由で、壁や床に穴を開ける工事は難しいです。" },
  { label: "まだ測っていない", value: "置く場所の寸法はまだ測っていません。採寸して確認したいです。" }
];

function getFollowUpChoices(field) {
  if (field === "scene") {
    return [
      { label: "入浴", value: "入浴で困っています。" },
      { label: "排泄", value: "排泄で困っています。" },
      { label: "移動", value: "移動や歩行で困っています。" },
      { label: "ベッド周り", value: "ベッド周りで困っています。" },
      { label: "食事", value: "食事で困っています。" },
      { label: "住宅改修", value: "住宅改修や家の中の動線で困っています。" },
      { label: "生活支援", value: "毎日の生活動作で困っています。" }
    ];
  }
  if (field === "ability") return appendFallbackChoice(SceneAbilityChoices[state.facts.scene] || SceneAbilityChoices.mobility, field);
  if (field === "caregiver") return appendFallbackChoice(CaregiverChoices[state.facts.scene] || CaregiverChoices.default, field);
  if (field === "goal") return appendFallbackChoice(GoalChoices, field);
  if (field === "environment") return appendFallbackChoice(EnvironmentChoices, field);
  return [];
}

function appendFallbackChoice(choices, field) {
  const fallback = {
    ability: { label: "その他・近いものがない", value: "選択肢に近いものがありません。今の情報で広めに候補を見たいです。" },
    caregiver: { label: "まだ分からない", value: "手伝う人の状況はまだはっきり分かりません。" },
    goal: { label: "まだ決めきれていない", value: "優先したいことはまだ決めきれていません。安全性と使いやすさを見ながら考えたいです。" },
    environment: { label: "まだ分からない", value: "設置場所や寸法はまだはっきり分かりません。" },
    additional: { label: "その他・文章で補足", value: "選択肢に近いものがないので、文章で補足します。" }
  }[field];
  return fallback && !choices.some((choice) => choice.label === fallback.label) ? [...choices, fallback] : choices;
}

function getAdditionalRequestChoices() {
  return appendFallbackChoice([
    { label: "別の商品も見たい", value: "別の商品も見たいです。" },
    { label: "コンパクトなものがよい", value: "置く場所が狭いので、コンパクトなものがよいです。" },
    { label: "レンタル費用を知りたい", value: "レンタルできるものは費用も確認したいです。" },
    { label: "安全性を優先したい", value: "安全性を優先して選びたいです。" }
  ], "additional");
}

function buildFollowUpQuestion(missing) {
  if (missing.includes("scene")) {
    return {
      fields: ["scene"],
      text: "いちばん困っている場面に近いものを選んでください。思い浮かんでいる介護用品があれば、文章で補足できます。",
      choices: getFollowUpChoices("scene")
    };
  }
  if (missing.includes("ability")) {
    return {
      fields: ["ability"],
      text: getSceneFollowUp(
        "ability",
        "困っている動きに近いものを選んでください。選択肢にない場合は、下の入力欄にそのまま書けます。"
      ),
      choices: getFollowUpChoices("ability")
    };
  }
  if (missing.includes("caregiver")) {
    return {
      fields: ["caregiver"],
      text: getSceneFollowUp(
        "caregiver",
        "手伝う人の状況に近いものを選んでください。"
      ),
      choices: getFollowUpChoices("caregiver")
    };
  }
  if (missing.includes("goal")) {
    return {
      fields: ["goal"],
      text: "今回いちばん大事にしたいことに近いものを選んでください。置く場所の広さや寸法は次に確認します。",
      choices: getFollowUpChoices("goal")
    };
  }
  return {
    fields: ["environment"],
    text: "使う場所の広さや条件に近いものを選んでください。寸法が分かる場合は文章で補足できます。",
    choices: getFollowUpChoices("environment")
  };
}

function applyPendingAnswerFallback(text, pendingFields) {
  if (pendingFields.length !== 1) return;
  const field = pendingFields[0];
  if (field === "scene") return;
  if (!CatalogData.fieldLabels[field] || state.facts[field]) return;
  state.facts[field] = summarizeFreeTextAnswer(text);
}

function summarizeFreeTextAnswer(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

function buildRecommendation() {
  const scene = CatalogData.scenes[state.facts.scene];
  const rankedItems = rankItems(scene);
  const desiredItems = getDesiredCatalogItems();
  const items = mergeRecommendedItems(desiredItems, rankedItems).slice(0, 5);
  const rankedProducts = searchCatalogProducts(scene);
  const products = selectProducts(rankedProducts, 5);
  const productItems = products
    .map((product) => findCatalogItemById(product.categoryId))
    .filter(Boolean);
  return {
    scene,
    items: mergeRecommendedItems(productItems, items).slice(0, 5),
    products,
    best: products[0] || items[0],
    complementary: products[1] || items[1]
  };
}

function getDesiredCatalogItems() {
  return state.desiredItemIds
    .map((itemId, index) => {
      const item = findCatalogItemById(itemId);
      return item ? { ...item, score: 80 - index } : null;
    })
    .filter(Boolean);
}

function mergeRecommendedItems(preferredItems, rankedItems) {
  const merged = [];
  const seen = new Set();
  for (const item of [...preferredItems, ...rankedItems]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

function selectProducts(rankedProducts, limit) {
  const selected = [];
  const usedProductNames = new Set();

  for (const itemId of promoteIds(state.desiredItemIds, state.profile.latestItemIds)) {
    const product = rankedProducts.find((candidate) => candidate.categoryId === itemId && !usedProductNames.has(productTitle(candidate)));
    if (product) {
      selected.push(product);
      usedProductNames.add(productTitle(product));
    }
    if (selected.length >= limit) return selected;
  }

  for (const product of rankedProducts) {
    const title = productTitle(product);
    if (usedProductNames.has(title)) continue;
    selected.push(product);
    usedProductNames.add(title);
    if (selected.length >= limit) break;
  }
  return selected;
}

function searchCatalogProducts(scene) {
  const productRecords = getProductRecords();
  const fullText = normalize(getSearchText());
  const goalText = normalize(state.facts.goal);
  const desiredText = normalize(state.facts.desired);
  const constraintsText = normalize(state.profile.constraints.join("。"));
  const rankedSceneItems = scene ? rankItems(scene) : [];
  const itemScore = new Map(rankedSceneItems.map((item, index) => [item.id, item.score + 30 - index]));
  const latestItemIds = state.profile.latestItemIds;
  const preferredItemIds = state.desiredItemIds;

  return productRecords
    .map((record, index) => {
      if (isProductHardExcluded(record, fullText, goalText)) return { ...record, score: -999 };

      let score = itemScore.get(record.categoryId) || 0;
      const latestIndex = latestItemIds.indexOf(record.categoryId);
      const preferredIndex = preferredItemIds.indexOf(record.categoryId);

      if (latestIndex >= 0) score += 180 - latestIndex * 6;
      else if (preferredIndex >= 0) score += 120 - preferredIndex * 4;
      if (record.sceneKey === state.facts.scene) score += 12;
      else if (!isCategoryExplicit(record.categoryId)) score -= 55;
      if (state.profile.scenes.includes(record.sceneKey)) score += 5;

      for (const keyword of record.keywords || []) {
        if (fullText.includes(normalize(keyword))) score += 4;
      }
      if (desiredText) {
        for (const term of productSearchTerms(record)) {
          const normalizedTerm = normalize(term);
          if (normalizedTerm.length >= 3 && (desiredText.includes(normalizedTerm) || normalizedTerm.includes(desiredText))) {
            score += 8;
          }
        }
      }

      if ((goalText.includes("自立") || goalText.includes("自分") || goalText.includes("本人")) && record.goals?.includes("self")) score += 2;
      if (goalText.includes("負担") && record.goals?.includes("caregiver")) score += 2;
      if ((goalText.includes("安全") || goalText.includes("転倒") || goalText.includes("危なく")) && record.goals?.includes("safety")) score += 2;
      if (goalText.includes("清潔") && record.goals?.includes("hygiene")) score += 2;
      score += scoreProductConstraints(record, constraintsText, fullText);
      score += scoreCareContext(record, fullText, goalText);
      score += scoreDecisionMeta(record, fullText, goalText, constraintsText);

      if (record.categoryId === "mob-walker" && hasAny(fullText, ["両手", "疲れやす", "休憩", "屋外"])) score += 6;
      if (record.categoryId === "mob-cane" && hasAny(fullText, ["両手", "強いふらつき"])) score -= 6;

      return { ...record, score: score - index * 0.01 };
    })
    .filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.page) - Number(b.page));
}

function getProductRecords() {
  const records = [];
  for (const [itemId, products] of Object.entries(getCatalogProducts())) {
    const item = findCatalogItemById(itemId);
    if (!item) continue;
    const sceneKey = findSceneKeyByItemId(itemId);
    const decisionMeta = getCategoryDecisionMeta(item.id);
    for (const product of products) {
      records.push({
        ...product,
        category: item.type,
        categoryId: item.id,
        categoryPage: item.page,
        itemFit: item.fit,
        itemDemerits: item.demerits,
        itemFeatures: item.features,
        useWhen: decisionMeta.useWhen || [],
        avoidWhen: decisionMeta.avoidWhen || [],
        requiredAbilities: decisionMeta.requiredAbilities || [],
        caregiverNeed: decisionMeta.caregiver || "",
        noCaregiverFit: decisionMeta.noCaregiverFit === true,
        selfSupport: decisionMeta.selfSupport === true,
        caregiverRelief: decisionMeta.caregiverRelief === true,
        environmentFit: decisionMeta.environment || [],
        insurance: decisionMeta.insurance || {},
        decisionMeta,
        sceneKey
      });
    }
  }
  return records;
}

function getSearchText() {
  return [
    Object.values(state.facts).join("。"),
    state.profile.abilities.join("。"),
    state.profile.caregivers.join("。"),
    state.profile.goals.join("。"),
    state.profile.environments.join("。"),
    state.profile.constraints.join("。"),
    state.profile.lastText
  ].join("。");
}

function getCategoryDecisionMeta(categoryId) {
  if (typeof CatalogProductCategoryMeta === "undefined") return {};
  return CatalogProductCategoryMeta[categoryId] || {};
}

function isCategoryExplicit(categoryId) {
  return state.desiredItemIds.includes(categoryId) || state.profile.latestItemIds.includes(categoryId);
}

function getFocusedItemIds() {
  return state.profile.latestItemIds.length > 0 ? state.profile.latestItemIds : state.desiredItemIds;
}

function focusedIncludes(itemIds) {
  const focusedItemIds = getFocusedItemIds();
  return itemIds.some((itemId) => focusedItemIds.includes(itemId));
}

function getFocusedCompatibleItemIds() {
  const focusedItemIds = getFocusedItemIds();
  const compatibleItemIds = new Set(focusedItemIds);
  for (const itemId of focusedItemIds) {
    for (const compatibleItemId of FocusedCompatibleItemIds[itemId] || [itemId]) {
      compatibleItemIds.add(compatibleItemId);
    }
  }
  return compatibleItemIds;
}

function isCategoryBlockedByFocusedRequest(categoryId, fullText, goalText) {
  const focusedItemIds = getFocusedItemIds();
  if (focusedItemIds.length === 0 || focusedItemIds.includes(categoryId)) return false;

  if (!getFocusedCompatibleItemIds().has(categoryId)) return true;
  if (focusedItemIds.includes("mob-walker") && categoryId === "mob-cane") return true;
  if (focusedItemIds.includes("mob-cane") && categoryId === "mob-walker") return true;
  if (focusedIncludes([...HandrailAndBathSupportItemIds]) && categoryId === "mob-cane") return true;
  if (focusedItemIds.includes("daily-stand") && categoryId === "daily-monitor") return true;
  if (focusedItemIds.includes("bed-rail") && categoryId === "bed-lift" && !hasStrongLiftNeed(fullText)) return true;
  if (focusedItemIds.includes("bed-rail") && categoryId === "mob-wheelchair" && !hasExplicitWheelchairUseRequest(fullText)) return true;
  if (
    focusedIncludes([...BathSelfSupportItemIds]) &&
    categoryId === "bath-shower-carry" &&
    (wantsSelfSupport(fullText, goalText) || hasLimitedCaregiver(fullText))
  ) {
    return true;
  }

  return false;
}

function isProductHardExcluded(product, fullText, goalText) {
  if (isCategoryBlockedByFocusedRequest(product.categoryId, fullText, goalText)) return true;

  if (product.categoryId === "bed-lift" && hasBedSupportRequest(fullText) && !hasStrongLiftNeed(fullText)) return true;
  if (product.categoryId === "mob-wheelchair" && hasWheelchairTransferSupportContext(fullText) && !hasLatestExplicitWheelchairUseRequest()) return true;
  if (
    product.categoryId === "mob-wheelchair" &&
    hasBedSupportRequest(fullText) &&
    !hasExplicitWheelchairUseRequest(fullText) &&
    !hasLatestExplicitWheelchairUseRequest()
  ) {
    return true;
  }

  if (state.facts.scene && product.sceneKey !== state.facts.scene && !isCategoryExplicit(product.categoryId)) return true;

  const wantsSelf = wantsSelfSupport(fullText, goalText);
  const limitedCaregiver = hasLimitedCaregiver(fullText);
  if (HandsOnCaregiverItemIds.has(product.categoryId) && wantsSelf && limitedCaregiver) return true;

  const meta = product.decisionMeta || getCategoryDecisionMeta(product.categoryId);
  if (limitedCaregiver && meta.noCaregiverFit === false && wantsSelf && !isCategoryExplicit(product.categoryId)) return true;

  return false;
}

function scoreDecisionMeta(product, fullText, goalText, constraintsText) {
  const meta = product.decisionMeta || getCategoryDecisionMeta(product.categoryId);
  let score = 0;
  const positiveSignals = meta.positiveSignals || [];
  const negativeSignals = meta.negativeSignals || [];
  const wantsSelf = wantsSelfSupport(fullText, goalText);
  const limitedCaregiver = hasLimitedCaregiver(fullText);
  const wantsCaregiverRelief = hasAny(`${fullText}。${goalText}`, ["負担", "楽に", "腰痛", "介助を減ら", "抱え"]);
  const wantsRental = hasAny(`${fullText}。${constraintsText}`, ["レンタル", "借りる", "試用", "デモ"]);
  const wantsNoConstruction = hasAny(fullText, ["工事できない", "穴を開け", "賃貸", "置き型"]);
  const wantsCompact = hasAny(fullText, ["狭い", "コンパクト", "小さい", "省スペース", "置けない"]);
  const metaText = normalize([
    ...(meta.useWhen || []),
    ...(meta.avoidWhen || []),
    ...(meta.requiredAbilities || []),
    ...(meta.environment || []),
    product.bestFor || "",
    product.check || ""
  ].join("。"));

  for (const signal of positiveSignals) {
    if (fullText.includes(normalize(signal))) score += 12;
  }
  for (const signal of negativeSignals) {
    if (fullText.includes(normalize(signal))) score -= 18;
  }

  if (wantsSelf) score += meta.selfSupport ? 8 : -18;
  if (wantsCaregiverRelief) score += meta.caregiverRelief ? 7 : -4;
  if (limitedCaregiver) score += meta.noCaregiverFit ? 8 : -28;
  if (wantsRental) score += meta.insurance?.rental ? 7 : -3;
  if (wantsNoConstruction) {
    score += hasAny(metaText, ["工事なし", "置き型", "賃貸", "穴を開け"]) ? 8 : -5;
  }
  if (wantsCompact) {
    if (hasAny(metaText, ["狭い", "コンパクト", "小さい", "ミニ", "省スペース", "折りたたみ"])) score += 8;
    if (["bath-shower-carry", "bed-lift", "bed-care-bed", "mob-wheelchair", "mob-slope", "house-slope"].includes(product.categoryId)) score -= 8;
  }
  const currentWheelchairFocus = state.profile.latestItemIds.includes("mob-wheelchair") && hasLatestExplicitWheelchairUseRequest();
  if (hasBedSupportRequest(fullText) && !currentWheelchairFocus) {
    if (product.categoryId === "bed-rail") score += 70;
    else if (BedRailPreferredItemIds.has(product.categoryId)) score += 24;
    if (product.categoryId === "bed-lift" && !hasStrongLiftNeed(fullText)) score -= 120;
    if (product.categoryId === "mob-wheelchair" && !hasExplicitWheelchairUseRequest(fullText)) score -= 120;
  }
  if (product.categoryId === "bed-lift" && !hasStrongLiftNeed(fullText) && !isCategoryExplicit("bed-lift")) score -= 60;
  if (product.categoryId === "mob-wheelchair" && hasWheelchairTransferSupportContext(fullText) && !hasLatestExplicitWheelchairUseRequest()) score -= 120;

  return score;
}

function scoreProductConstraints(product, constraintsText, fullText) {
  const productText = normalize(productSearchTerms(product).join("。") + "。" + (product.bestFor || "") + "。" + (product.check || ""));
  let score = 0;
  if (constraintsText.includes("コンパクト") || fullText.includes("狭い") || fullText.includes("小さい")) {
    if (hasAny(productText, ["コンパクト", "小さい", "ミニ", "mini", "スリム", "省スペース"])) score += 18;
    else if (hasAny(productText, ["折りたたみ", "省スペース"])) score += 6;
    if (fullText.includes("狭い") && productText.includes("狭い")) score += 4;
  }
  if (constraintsText.includes("費用")) {
    const price = getLowestPrice(product.price);
    if (price && price <= 30000) score += 8;
    else if (price && price <= 60000) score += 3;
  }
  if (constraintsText.includes("軽さ") || fullText.includes("軽い")) {
    if (hasAny(productText, ["軽い", "軽量", "持ち運び", "折りたたみ"])) score += 8;
  }
  if (constraintsText.includes("夜間")) {
    if (["toilet-portable", "toilet-pad", "daily-monitor"].includes(product.categoryId)) score += 10;
  }
  return score;
}

function scoreCareContext(product, fullText, goalText) {
  let score = 0;
  const wantsSelf = wantsSelfSupport(fullText, goalText);
  const limitedCaregiver = hasLimitedCaregiver(fullText);
  const needsHandsOnCaregiver = HandsOnCaregiverItemIds.has(product.categoryId);

  if (wantsSelf && product.goals?.includes("self")) score += 8;
  if (limitedCaregiver && product.goals?.includes("self")) score += 6;
  if (wantsSelf && limitedCaregiver && product.goals?.includes("self")) score += 10;

  if (needsHandsOnCaregiver && wantsSelf) score -= 70;
  if (needsHandsOnCaregiver && limitedCaregiver) score -= 90;
  if (needsHandsOnCaregiver && wantsSelf && limitedCaregiver) score -= 140;

  return score;
}

function wantsSelfSupport(fullText, goalText) {
  return hasAny(`${fullText}。${goalText}`, ["自立", "自分で", "本人が自分", "本人だけ", "できるだけ本人"]);
}

function hasLimitedCaregiver(fullText) {
  return hasAny(fullText, [
    "手伝う人がいない",
    "すぐ対応しにくい",
    "本人だけ",
    "独り",
    "独居",
    "不在",
    "日中や夜間に本人だけ",
    "一人になる",
    "ひとりになる"
  ]);
}

function getLowestPrice(priceText = "") {
  const numbers = String(priceText).match(/\d[\d,]*/g);
  if (!numbers) return 0;
  return Math.min(...numbers.map((value) => Number(value.replaceAll(",", ""))).filter(Boolean));
}

function getConversationSceneLabel(fallbackScene) {
  const sceneKeys = promoteIds(state.profile.scenes, state.facts.scene ? [state.facts.scene] : []);
  const labels = sceneKeys
    .map((sceneKey) => CatalogData.scenes[sceneKey]?.label)
    .filter(Boolean);
  return labels.length ? labels.slice(0, 3).join(" / ") : fallbackScene.label;
}

function rankItems(scene) {
  const fullText = normalize(Object.values(state.facts).join(" "));
  const goalText = normalize(state.facts.goal);
  return scene.items
    .map((item, index) => {
      let score = 10 - index * 0.2;
      for (const trigger of item.triggers) {
        if (fullText.includes(normalize(trigger))) score += 3;
      }
      if (hasBedSupportRequest(fullText)) {
        if (item.id === "bed-rail") score += 24;
        else if (BedRailPreferredItemIds.has(item.id)) score += 8;
        if (item.id === "bed-lift" && !hasStrongLiftNeed(fullText)) score -= 28;
        if (item.id === "mob-wheelchair" && !hasExplicitWheelchairUseRequest(fullText)) score -= 28;
      }
      if (item.id === "mob-walker" && hasAny(fullText, ["両手", "疲れやす", "休憩", "屋外"])) score += 6;
      if (item.id === "mob-cane" && hasAny(fullText, ["両手", "強いふらつき"])) score -= 4;
      if (state.facts.desired && normalize(state.facts.desired).includes(normalize(item.type))) score += 4;
      if ((goalText.includes("自立") || goalText.includes("自分") || goalText.includes("本人")) && item.goals.includes("self")) score += 2;
      if (goalText.includes("負担") && item.goals.includes("caregiver")) score += 2;
      if ((goalText.includes("安全") || goalText.includes("転倒") || goalText.includes("危なく")) && item.goals.includes("safety")) score += 2;
      if (goalText.includes("清潔") && item.goals.includes("hygiene")) score += 2;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);
}

function rankProducts(items) {
  const catalogProducts = getCatalogProducts();
  const fullText = normalize(Object.values(state.facts).join(" "));
  const goalText = normalize(state.facts.goal);
  const desiredText = normalize(state.facts.desired);
  const scoredProducts = [];

  for (const [itemIndex, item] of items.entries()) {
    const products = catalogProducts[item.id] || [];
    if (products.length === 0) {
      scoredProducts.push(createFallbackProduct(item, itemIndex));
      continue;
    }

    for (const [productIndex, product] of products.entries()) {
      let score = item.score + (items.length - itemIndex) * 0.5 - productIndex * 0.12;
      const keywords = product.keywords || [];
      for (const keyword of keywords) {
        if (fullText.includes(normalize(keyword))) score += 2.4;
      }
      if (desiredText) {
        for (const term of productSearchTerms(product)) {
          const normalizedTerm = normalize(term);
          if (normalizedTerm.length >= 3 && (desiredText.includes(normalizedTerm) || normalizedTerm.includes(desiredText))) {
            score += 3.4;
          }
        }
      }
      if ((goalText.includes("自立") || goalText.includes("自分") || goalText.includes("本人")) && product.goals?.includes("self")) score += 1.2;
      if (goalText.includes("負担") && product.goals?.includes("caregiver")) score += 1.2;
      if ((goalText.includes("安全") || goalText.includes("転倒") || goalText.includes("危なく")) && product.goals?.includes("safety")) score += 1.2;
      if (goalText.includes("清潔") && product.goals?.includes("hygiene")) score += 1.2;
      if (item.id === "mob-walker" && hasAny(fullText, ["両手", "疲れやす", "休憩", "屋外"])) score += 2;
      if (item.id === "mob-cane" && hasAny(fullText, ["両手", "強いふらつき"])) score -= 2;

      scoredProducts.push({
        ...product,
        category: item.type,
        categoryId: item.id,
        categoryPage: item.page,
        itemFit: item.fit,
        itemDemerits: item.demerits,
        itemFeatures: item.features,
        score
      });
    }
  }

  return scoredProducts.sort((a, b) => b.score - a.score || Number(a.page) - Number(b.page));
}

function createFallbackProduct(item, itemIndex) {
  const decisionMeta = getCategoryDecisionMeta(item.id);
  return {
    maker: "",
    name: item.type,
    model: "",
    page: item.page,
    price: "",
    bestFor: item.fit,
    check: item.demerits,
    category: item.type,
    categoryId: item.id,
    categoryPage: item.page,
    itemFit: item.fit,
    itemFeatures: item.features,
    useWhen: decisionMeta.useWhen || [],
    avoidWhen: decisionMeta.avoidWhen || [],
    requiredAbilities: decisionMeta.requiredAbilities || [],
    caregiverNeed: decisionMeta.caregiver || "",
    noCaregiverFit: decisionMeta.noCaregiverFit === true,
    selfSupport: decisionMeta.selfSupport === true,
    caregiverRelief: decisionMeta.caregiverRelief === true,
    environmentFit: decisionMeta.environment || [],
    insurance: decisionMeta.insurance || {},
    decisionMeta,
    fallback: true,
    score: item.score - itemIndex * 0.1
  };
}

const SceneAbilityLabels = {
  bath: "入浴で困る動き",
  toilet: "トイレで困る動き",
  bed: "ベッド周りで困る動き",
  mobility: "移動で困ること",
  meal: "食事で困ること",
  housing: "家の中で困る場所",
  daily: "生活で困る動作"
};

function getHearingLabels() {
  return {
    ...CatalogData.fieldLabels,
    ability: SceneAbilityLabels[state.facts.scene] || CatalogData.fieldLabels.ability
  };
}

function formatFactValue(key, value) {
  if (!value) return getFactPlaceholder(key);
  if (key === "scene") return CatalogData.scenes[value]?.label || value;
  return value;
}

function getFactPlaceholder(key) {
  if (key === "scene") return "未選択";
  if (key === "ability") return "選択してください";
  if (key === "caregiver") return "選択してください";
  if (key === "goal") return "選択してください";
  return "未入力";
}

function renderRecommendation(result) {
  const { scene, items, products, best, complementary } = result;
  const bubble = document.createElement("article");
  bubble.className = "message assistant rich";
  const compared = products.length ? products : items;
  const hearingLabels = getHearingLabels();

  const summaryRows = [
    [hearingLabels.scene, `${getConversationSceneLabel(scene)}${state.facts.desired ? `（候補: ${state.facts.desired}）` : ""}`],
    [hearingLabels.ability, state.facts.ability],
    [hearingLabels.caregiver, state.facts.caregiver],
    [hearingLabels.goal, state.facts.goal],
    [hearingLabels.environment, state.facts.environment],
    ["追加条件", state.profile.constraints.length ? state.profile.constraints.join("、") : "まだ確認が必要"]
  ];

  bubble.innerHTML = `
    <section>
      <h2>1. 状況の整理</h2>
      <p>${escapeHtml(scene.lens)}</p>
      <dl class="assessment-list">
        ${summaryRows
          .map(
            ([label, value]) => `
              <div>
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(cleanDisplayText(value))}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </section>

    <section>
      <h2>2. 候補商品の比較</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>商品名</th>
              <th>種類</th>
              <th>向いている理由</th>
              <th>確認すること</th>
              <th>価格</th>
            </tr>
          </thead>
          <tbody>
            ${compared
              .map(
                (product) => `
                  <tr>
                    <td class="product-name" data-label="商品名">
                      <strong>${escapeHtml(productTitle(product))}</strong>
                      ${product.model ? `<small>${escapeHtml(`型番: ${product.model}`)}</small>` : ""}
                      ${
                        product.catalogUnavailable
                          ? ""
                          : `<a class="product-catalog-link" href="${catalogPageHref(product)}" target="_blank" rel="noreferrer" data-page="${product.page}" data-pdf-page="${product.pdfPage || product.page}">
                              カタログ P${product.page}を開く
                            </a>`
                      }
                    </td>
                    <td data-label="種類">${escapeHtml(cleanDisplayText(product.category || product.type || "候補"))}</td>
                    <td data-label="向いている理由">${escapeHtml(cleanDisplayText(product.bestFor || product.itemFit || product.fit || ""))}</td>
                    <td data-label="確認すること">${escapeHtml(cleanDisplayText(product.check || product.itemDemerits || product.demerits || "現物の寸法と使う場所を確認。"))}</td>
                    <td data-label="価格">${renderProductCost(product)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>3. 今いちばん合いそうな商品と理由</h2>
      <p><strong>第一候補: ${escapeHtml(productTitle(best))}</strong>。${escapeHtml(cleanDisplayText(best.bestFor || best.itemFit || ""))} ${escapeHtml(state.facts.goal)}という希望と合います。</p>
      ${
        complementary
          ? `<p>${escapeHtml(productTitle(complementary))}は、第一候補で足りない部分が残る場合の比較候補です。実際の動作確認で、支えの位置、置く場所、介助量を見て判断してください。</p>`
          : ""
      }
    </section>

    <section>
      <h2>4. まずはご相談ください</h2>
      <div class="consultation-box">
        <p>桜十字福祉用具　担当堀江（090-9576-3944）までお気軽にご相談ください。</p>
      </div>
    </section>
  `;

  messagesEl.appendChild(bubble);
  scrollMessages();
}

function renderFacts() {
  const labels = getHearingLabels();
  const completed = Object.keys(labels).filter((key) => state.facts[key]).length;
  progressCountEl.textContent = `${completed}/${Object.keys(labels).length}`;
  factGridEl.innerHTML = Object.entries(labels)
    .map(([key, label]) => {
      const value = formatFactValue(key, state.facts[key]);
      const status = state.facts[key] ? "filled" : "empty";
      return `
        <div class="fact ${status}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderPageList(items) {
  const pages = items.length
    ? items
    : CatalogData.meta.defaultPages || [
        { name: "特殊寝台", page: 4, pdfPage: 6 },
        { name: "歩行器", page: 28, pdfPage: 30 },
        { name: "手すり", page: 38, pdfPage: 40 },
        { name: "車いす", page: 52, pdfPage: 54 }
      ];

  catalogSourceEl.textContent = pages.map((item) => `P${item.page}`).slice(0, 3).join(" / ");
  pageListEl.innerHTML = pages
    .map(
      (item) => `
        <button type="button" data-page="${item.page}" data-pdf-page="${item.pdfPage || item.page}">
          <span>P${item.page}</span>
          <strong>${escapeHtml(productPageLabel(item))}</strong>
        </button>
      `
    )
    .join("");
}

function setCatalogPage(target, pdfPage) {
  const pageInfo = resolveCatalogPage(target, pdfPage);
  const label = getPageLabel(pageInfo.page);
  previewPageEl.textContent = `P${pageInfo.page}`;
  previewTitleEl.textContent = label;
  previewLinkEl.href = catalogPageHref(pageInfo);
  if (CatalogData.meta.previewImages === false) {
    previewImageEl.hidden = true;
    previewMediaEl.dataset.empty = "true";
    return;
  }
  previewImageEl.alt = `P${pageInfo.page} ${label}`;
  previewMediaEl.dataset.empty = "false";
  previewImageEl.hidden = false;
  previewImageEl.src = `assets/page-${pageInfo.pdfPage || pageInfo.page}.jpg`;
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = inputEl.value;
  inputEl.value = "";
  handleUserMessage(text);
});

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    formEl.requestSubmit();
  }
});

quickChipsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-seed]");
  if (!button) return;
  inputEl.value = button.dataset.seed;
  formEl.requestSubmit();
});

messagesEl.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-choice-text]");
  if (choice) {
    choice.disabled = true;
    choice.classList.add("selected");
    handleUserMessage(choice.dataset.choiceText, {
      itemIds: (choice.dataset.choiceItemIds || "").split(",").filter(Boolean)
    });
    return;
  }

  const control = event.target.closest("[data-page]");
  if (!control) return;
  setCatalogPage(control.dataset.page, control.dataset.pdfPage);
});

pageListEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button) return;
  setCatalogPage(button.dataset.page, button.dataset.pdfPage);
});

resetButtonEl.addEventListener("click", resetConversation);

previewImageEl.addEventListener("error", () => {
  previewImageEl.hidden = true;
  previewMediaEl.dataset.empty = "true";
});

function getPageLabel(page) {
  const pageNumber = Number(page);
  if (pageNumber === Number(CatalogData.meta.defaultPage)) return "Acolclub目次";
  for (const products of Object.values(getCatalogProducts())) {
    const product = products.find((candidate) => Number(candidate.page) === pageNumber);
    if (product) return product.name;
  }
  for (const scene of Object.values(CatalogData.scenes)) {
    const item = scene.items.find((candidate) => candidate.page === pageNumber);
    if (item) return item.type;
    const sceneStart = scene.items[0]?.page;
    if (sceneStart === pageNumber) return scene.label;
  }
  return "カタログ";
}

init();
