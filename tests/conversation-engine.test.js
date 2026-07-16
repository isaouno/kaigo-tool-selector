const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createApp() {
  function createMemoryStorage() {
    const store = new Map();
    return {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      },
      clear() {
        store.clear();
      }
    };
  }

  class Element {
    constructor(id) {
      this.id = id;
      this.children = [];
      this.dataset = {};
      this.className = "";
      this.innerHTML = "";
      this.textContent = "";
      this.hidden = false;
      this.value = "";
      this.href = "";
      this.src = "";
      this.alt = "";
      this.scrollTop = 0;
      this.scrollHeight = 0;
    }

    appendChild(child) {
      this.children.push(child);
      this.scrollHeight = this.children.length;
    }

    addEventListener() {}
    focus() {}
    requestSubmit() {}
  }

  const elements = {};
  const storage = createMemoryStorage();
  const context = {
    console,
    localStorage: storage,
    document: {
      getElementById(id) {
        if (!elements[id]) elements[id] = new Element(id);
        return elements[id];
      },
      createElement(tag) {
        return new Element(tag);
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(
    [
      fs.readFileSync("catalog-data.js", "utf8"),
      fs.readFileSync("product-data.js", "utf8"),
      fs.readFileSync("app.js", "utf8"),
      "globalThis.__test = { handleUserMessage, undoLastTurn, resetConversation, scrollMessages, state, CatalogProducts, CatalogProductCategoryMeta, CatalogData, catalogPageHref, catalogPageImagePath: typeof catalogPageImagePath === 'function' ? catalogPageImagePath : undefined, renderCatalogPageButton: typeof renderCatalogPageButton === 'function' ? renderCatalogPageButton : undefined, showCatalogPageModal: typeof showCatalogPageModal === 'function' ? showCatalogPageModal : undefined, openInsuranceGuide: typeof openInsuranceGuide === 'function' ? openInsuranceGuide : undefined, renderProductCost, renderProductImage: typeof renderProductImage === 'function' ? renderProductImage : undefined, addToConsultationList, removeFromConsultationList, clearConsultationList, getConsultationList, consultationItemKey, renderConsultationListHtml, renderConsultationAddButton };"
    ].join("\n"),
    context
  );
  return { elements, app: context.__test, storage };
}

function lastAssistantHtml(elements) {
  return elements.messages.children.at(-1).innerHTML;
}

function firstCandidate(elements) {
  return (lastAssistantHtml(elements).match(/第一候補: .*?<\/strong>/) || [""])[0].replace(/<[^>]+>/g, "");
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeAttribute(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function choiceButtons(elements) {
  const buttons = [];
  const buttonPattern = /<button[\s\S]*?<\/button>/g;
  for (const [buttonHtml] of lastAssistantHtml(elements).matchAll(buttonPattern)) {
    const value = (buttonHtml.match(/data-choice-text="([^"]*)"/) || [])[1] || "";
    if (!value) continue;
    const itemIds = (buttonHtml.match(/data-choice-item-ids="([^"]*)"/) || [])[1] || "";
    buttons.push({
      label: stripHtml(buttonHtml),
      value: decodeAttribute(value),
      itemIds: decodeAttribute(itemIds).split(",").filter(Boolean)
    });
  }
  return buttons;
}

function firstCategoryId(app) {
  return app.state.recommendations[0]?.categoryId || "";
}

function topCategoryIds(app, count = 5) {
  return app.state.recommendations.slice(0, count).map((product) => product.categoryId);
}

function answerDefaultEnvironment(app) {
  app.handleUserMessage("置く場所の広さはおおむね確保できています。");
}

function answerCommonRequired(app) {
  app.handleUserMessage("手伝う人は主に1人です。");
  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。");
  answerDefaultEnvironment(app);
}

{
  const indexHtml = fs.readFileSync("index.html", "utf8");
  const topbarActions = (indexHtml.match(/<div class="topbar-actions">([\s\S]*?)<\/div>/) || [])[1] || "";
  const resetIndex = topbarActions.indexOf('id="resetButton"');
  const insuranceIndex = topbarActions.indexOf('id="insuranceFlowButton"');
  const catalogIndex = topbarActions.indexOf('href="acolclub.pdf#page=3"');

  assert.ok(resetIndex >= 0, "topbar should keep reset button");
  assert.ok(insuranceIndex > resetIndex, "insurance flow button should appear after reset button");
  assert.ok(catalogIndex > insuranceIndex, "insurance flow button should appear before catalog link");
  assert.match(topbarActions, /id="insuranceFlowButton"[\s\S]*介護保険利用の流れ/);
}

const handsOnCaregiverItemIds = new Set([
  "bath-transfer-board",
  "bath-shower-carry",
  "bed-transfer-glove",
  "bed-lift"
]);

{
  const { elements, app } = createApp();
  app.handleUserMessage("入浴で困っています。", { choiceLabel: "入浴" });
  const html = lastAssistantHtml(elements);
  assert.match(html, /今回の選択内容/);
  assert.match(html, /selection-chip/);
  assert.match(html, /入浴/);
  assert.match(html, /data-choice-mode="multi"/);
  assert.match(html, /data-choice-submit/);
  assert.doesNotMatch(html, /手伝う人<\/small>/);
  assert.doesNotMatch(html, /場所<\/small>/);
}

{
  const { elements, app } = createApp();
  const initialMessageCount = elements.messages.children.length;
  app.handleUserMessage("入浴で困っています。", { choiceLabel: "入浴", undoable: true });
  assert.equal(app.state.facts.scene, "bath");
  assert.ok((app.state.profile.selectionFacts || []).some((entry) => entry.value === "入浴"));
  assert.ok(elements.messages.children.length > initialMessageCount);
  const undoHtml = lastAssistantHtml(elements);
  assert.doesNotMatch(undoHtml, /直前の選択を取り消す/);
  assert.match(undoHtml, /ひとつ前に戻る/);
  assert.match(undoHtml, /最初からやり直す/);
  assert.match(undoHtml, /data-reset-chat/);
  assert.equal(elements.messages.scrollTop, elements.messages.scrollHeight);
  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.scene, "");
  assert.equal(app.state.profile.selectionFacts.length, 0);
  assert.equal(app.state.desiredItemIds.length, 0);
  assert.equal(app.state.recommendations.length, 0);
  assert.equal(app.state.pendingFields.length, 0);
  assert.equal(elements.messages.children.length, initialMessageCount);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("入浴で困っています。", { choiceLabel: "入浴", undoable: true });
  assert.equal(app.state.facts.scene, "bath");
  app.resetConversation();
  assert.equal(app.state.facts.scene, "");
  assert.equal(app.state.profile.selectionFacts.length, 0);
  assert.equal(app.state.desiredItemIds.length, 0);
  assert.equal(app.state.recommendations.length, 0);
  assert.equal(app.state.pendingFields.length, 0);
  assert.equal(elements.messages.children.length, 1);
  assert.match(lastAssistantHtml(elements), /福祉用具えらびサポートです/);
  assert.equal(elements.quickChips.hidden, false);
  assert.equal(elements.messages.scrollTop, elements.messages.scrollHeight);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("食事で困っています。", { choiceLabel: "食事", undoable: true });
  const afterSceneMessageCount = elements.messages.children.length;

  app.handleUserMessage(
    "スプーンや箸が使いにくく、皿が動いたり食べこぼしが多かったりして困っています。",
    {
      itemIds: ["meal-spoon", "meal-dish"],
      choiceLabels: ["スプーンや箸が使いにくい", "皿が動く・こぼす"],
      undoable: true
    }
  );
  assert.ok(app.state.profile.itemIds.includes("meal-spoon"));
  assert.ok(app.state.profile.latestItemIds.includes("meal-dish"));
  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.scene, "meal");
  assert.equal(app.state.facts.ability, "");
  assert.equal(app.state.profile.itemIds.length, 0);
  assert.equal(app.state.profile.latestItemIds.length, 0);
  assert.equal(app.state.pendingFields[0], "ability");
  assert.equal(elements.messages.children.length, afterSceneMessageCount);

  app.handleUserMessage(
    "スプーンや箸が使いにくく、皿が動いたり食べこぼしが多かったりして困っています。",
    {
      itemIds: ["meal-spoon", "meal-dish"],
      choiceLabels: ["スプーンや箸が使いにくい", "皿が動く・こぼす"],
      undoable: true
    }
  );
  const afterAbilityMessageCount = elements.messages.children.length;

  app.handleUserMessage("食事の手伝いは主に1人です。", {
    choiceLabels: ["主に1人で付き添う"],
    undoable: true
  });
  assert.match(app.state.facts.caregiver, /主に1人/);
  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.caregiver, "");
  assert.equal(app.state.pendingFields[0], "caregiver");
  assert.ok(app.state.profile.itemIds.includes("meal-spoon"));
  assert.equal(elements.messages.children.length, afterAbilityMessageCount);

  app.handleUserMessage("食事の手伝いは主に1人です。", {
    choiceLabels: ["主に1人で付き添う"],
    undoable: true
  });
  const afterCaregiverMessageCount = elements.messages.children.length;

  app.handleUserMessage("費用やレンタルできるかも確認したいです。", {
    choiceLabels: ["費用・レンタルも確認"],
    undoable: true
  });
  assert.match(app.state.facts.goal, /費用|レンタル/);
  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.goal, "");
  assert.equal(app.state.pendingFields[0], "goal");
  assert.match(app.state.facts.caregiver, /主に1人/);
  assert.equal(elements.messages.children.length, afterCaregiverMessageCount);

  app.handleUserMessage("費用やレンタルできるかも確認したいです。", {
    choiceLabels: ["費用・レンタルも確認"],
    undoable: true
  });
  const afterGoalMessageCount = elements.messages.children.length;

  app.handleUserMessage("置く場所の広さはおおむね確保できています。", {
    choiceLabels: ["広さはおおむね確保できる"],
    undoable: true
  });
  assert.ok(app.state.recommendations.length > 0);
  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.environment, "");
  assert.equal(app.state.recommendations.length, 0);
  assert.equal(app.state.pendingFields[0], "environment");
  assert.equal(elements.messages.children.length, afterGoalMessageCount);
}

{
  const { app } = createApp();
  app.handleUserMessage("食事で困っています。", { choiceLabel: "食事", undoable: true });
  app.handleUserMessage(
    "スプーンや箸が使いにくく、皿が動いたり食べこぼしが多かったりして困っています。",
    {
      itemIds: ["meal-spoon", "meal-dish"],
      choiceLabels: ["スプーンや箸が使いにくい", "皿が動く・こぼす"],
      undoable: true
    }
  );
  app.handleUserMessage("食事の手伝いは主に1人です。", {
    choiceLabels: ["主に1人で付き添う"],
    undoable: true
  });
  app.handleUserMessage("費用やレンタルできるかも確認したいです。", {
    choiceLabels: ["費用・レンタルも確認"],
    undoable: true
  });
  app.handleUserMessage("置く場所の広さはおおむね確保できています。", {
    choiceLabels: ["広さはおおむね確保できる"],
    undoable: true
  });
  assert.ok(app.state.recommendations.length > 0);

  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.environment, "");
  assert.equal(app.state.recommendations.length, 0);
  assert.equal(app.state.pendingFields[0], "environment");

  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.goal, "");
  assert.equal(app.state.facts.caregiver.includes("主に1人"), true);
  assert.equal(app.state.pendingFields[0], "goal");

  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.caregiver, "");
  assert.ok(app.state.profile.itemIds.includes("meal-spoon"));
  assert.equal(app.state.pendingFields[0], "caregiver");

  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.ability, "");
  assert.equal(app.state.profile.itemIds.length, 0);
  assert.equal(app.state.profile.latestItemIds.length, 0);
  assert.equal(app.state.pendingFields[0], "ability");
  assert.equal(app.state.facts.scene, "meal");

  assert.equal(app.undoLastTurn(), true);
  assert.equal(app.state.facts.scene, "");
  assert.equal(app.state.pendingFields.length, 0);
  assert.equal(app.undoLastTurn(), false);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("移動や歩行で困っています。", { choiceLabel: "移動" });
  app.handleUserMessage(
    "外出中に疲れやすく、玄関や段差でも困っています。",
    {
      itemIds: ["mob-walker", "mob-slope"],
      choiceLabels: ["外出中に疲れやすい", "玄関や段差で困る"]
    }
  );
  assert.ok(app.state.profile.itemIds.includes("mob-walker"));
  assert.ok(app.state.profile.itemIds.includes("mob-slope"));
  assert.ok(app.state.profile.latestItemIds.includes("mob-walker"));
  assert.ok(app.state.profile.latestItemIds.includes("mob-slope"));
  assert.ok(app.state.desiredItemIds.includes("mob-walker"));
  assert.ok(app.state.desiredItemIds.includes("mob-slope"));
  assert.match(lastAssistantHtml(elements), /外出中に疲れやすい/);
  assert.match(lastAssistantHtml(elements), /玄関や段差で困る/);
  assert.doesNotMatch(lastAssistantHtml(elements), /候補商品の比較/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("食事で困っています。", { choiceLabel: "食事" });
  assert.match(lastAssistantHtml(elements), /data-choice-mode="multi"/);
  assert.match(lastAssistantHtml(elements), /data-choice-submit/);

  app.handleUserMessage(
    "スプーンや箸が使いにくく、皿が動いたり食べこぼしが多かったりして困っています。",
    {
      itemIds: ["meal-spoon", "meal-dish"],
      choiceLabels: ["スプーンや箸が使いにくい", "皿が動く・こぼす"]
    }
  );
  assert.match(lastAssistantHtml(elements), /data-choice-mode="multi"/);
  assert.match(lastAssistantHtml(elements), /data-choice-submit/);
  assert.ok(app.state.profile.itemIds.includes("meal-spoon"));
  assert.ok(app.state.profile.itemIds.includes("meal-dish"));
  assert.ok(app.state.profile.latestItemIds.includes("meal-spoon"));
  assert.ok(app.state.profile.latestItemIds.includes("meal-dish"));

  app.handleUserMessage(
    "食事の手伝いは主に1人です。食事中にむせないか、そばで確認する必要があります。",
    { choiceLabels: ["主に1人で付き添う", "むせないか確認している"] }
  );
  assert.match(lastAssistantHtml(elements), /data-choice-mode="multi"/);
  assert.match(lastAssistantHtml(elements), /data-choice-submit/);
  assert.match(app.state.facts.caregiver, /主に1人/);
  assert.ok(app.state.profile.selectionFacts.some((entry) => entry.field === "caregiver" && entry.value === "主に1人で付き添う"));
  assert.ok(app.state.profile.selectionFacts.some((entry) => entry.field === "caregiver" && entry.value === "むせないか確認している"));

  app.handleUserMessage(
    "できるだけ本人が自分でできるようにしたいです。安全を優先して、転倒や事故を防ぎたいです。",
    { choiceLabels: ["本人が自分でできる", "転倒や事故を防ぐ"] }
  );
  assert.match(lastAssistantHtml(elements), /data-choice-mode="multi"/);
  assert.match(lastAssistantHtml(elements), /data-choice-submit/);
  assert.match(app.state.facts.goal, /自分でできる/);
  assert.match(app.state.facts.goal, /転ばない|危なくない/);
  assert.ok(app.state.profile.selectionFacts.some((entry) => entry.field === "goal" && entry.value === "本人が自分でできる"));
  assert.ok(app.state.profile.selectionFacts.some((entry) => entry.field === "goal" && entry.value === "転倒や事故を防ぐ"));

  app.handleUserMessage(
    "置く場所が狭いので、コンパクトなものがよいです。賃貸などの理由で、壁や床に穴を開ける工事は難しいです。",
    { choiceLabels: ["狭い・置けるか不安", "工事は難しい"] }
  );
  assert.match(lastAssistantHtml(elements), /候補商品の比較/);
  assert.match(app.state.facts.environment, /広さに余裕が少ない/);
  assert.match(app.state.facts.environment, /工事は難しい/);
  assert.ok(app.state.profile.selectionFacts.some((entry) => entry.field === "environment" && entry.value === "狭い・置けるか不安"));
  assert.ok(app.state.profile.selectionFacts.some((entry) => entry.field === "environment" && entry.value === "工事は難しい"));
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("住宅改修や家の中の動線で困っています。", { choiceLabel: "住宅改修" });
  app.handleUserMessage(
    "玄関や廊下でふらつきます。段差でつまずきます。賃貸なので工事できないです。",
    {
      itemIds: ["house-rail", "house-slope"],
      choiceLabels: ["玄関・廊下に支えがほしい", "段差でつまずく", "工事せず置き型で考えたい"]
    }
  );
  app.handleUserMessage("手伝う人は主に1人です。", { choiceLabels: ["主に1人で手伝う"] });
  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。", { choiceLabels: ["転倒や事故を防ぐ"] });
  app.handleUserMessage("賃貸などの理由で、壁や床に穴を開ける工事は難しいです。", { choiceLabels: ["工事は難しい"] });
  const categoryIds = topCategoryIds(app, 5);
  assert.match(lastAssistantHtml(elements), /候補商品の比較/);
  assert.match(lastAssistantHtml(elements), /向いている人/);
  assert.ok(categoryIds.includes("house-rail"), `expected house-rail in ${categoryIds.join(",")}`);
  assert.ok(categoryIds.includes("house-slope"), `expected house-slope in ${categoryIds.join(",")}`);
  assert.ok(new Set(categoryIds).size > 1, `expected multiple categories in ${categoryIds.join(",")}`);
  assert.match(lastAssistantHtml(elements), /玄関・廊下に支えがほしい|工事せず置き型で考えたい/);
  assert.match(lastAssistantHtml(elements), /段差でつまずく|段差解消スロープ/);
}

{
  const { app } = createApp();
  app.handleUserMessage("自宅内の移動で階段昇降が必要です。階段が不安です。");
  assert.ok(app.state.profile.latestItemIds.includes("house-rail"), `stairs should detect house-rail, got ${app.state.profile.latestItemIds.join(",")}`);

  app.handleUserMessage("階段や廊下でふらつきがあり、転倒が不安です。", {
    itemIds: ["house-rail"],
    choiceLabels: ["階段が不安"]
  });
  app.handleUserMessage("手伝う人は主に1人です。", { choiceLabels: ["主に1人で手伝う"] });
  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。", { choiceLabels: ["転倒や事故を防ぐ"] });
  answerDefaultEnvironment(app);
  assert.notEqual(firstCategoryId(app), "mob-walker");
  assert.ok(topCategoryIds(app).includes("house-rail"), `expected house-rail in ${topCategoryIds(app).join(",")}`);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("入浴で困っています。", { choiceLabel: "入浴" });
  const movingChoice = choiceButtons(elements).find((choice) => choice.label.includes("浴室内の移動が難しい"));
  assert.ok(movingChoice);
  for (const expectedId of ["bath-shower-chair", "bath-tub-rail", "bath-tub-step"]) {
    assert.ok(movingChoice.itemIds.includes(expectedId), `bath movement choice should include ${expectedId}, got ${movingChoice.itemIds.join(",")}`);
  }
  app.handleUserMessage(movingChoice.value, { itemIds: movingChoice.itemIds, choiceLabels: [movingChoice.label] });
  app.handleUserMessage("日中や夜間に本人だけになる時間が多いです。", { choiceLabels: ["本人だけの時間が多い"] });
  app.handleUserMessage("できるだけ本人が自分でできるようにしたいです。", { choiceLabels: ["本人が自分でできる"] });
  answerDefaultEnvironment(app);
  const categoryIds = topCategoryIds(app, 5);
  const bathSupportCount = new Set(categoryIds.filter((categoryId) => ["bath-shower-chair", "bath-tub-rail", "bath-tub-step", "bath-shower-carry"].includes(categoryId))).size;
  assert.ok(bathSupportCount >= 2, `bath movement should keep multiple bath supports, got ${categoryIds.join(",")}`);
  assert.notEqual(firstCategoryId(app), "daily-stand");
}

{
  const { app } = createApp();
  app.handleUserMessage("トイレで便座が低くて立ち座りが不安です。尿もれと清拭も困ります。");
  for (const expectedId of ["toilet-rail", "toilet-seat", "toilet-pad", "toilet-clean"]) {
    assert.ok(app.state.profile.latestItemIds.includes(expectedId), `toilet multi concern should detect ${expectedId}, got ${app.state.profile.latestItemIds.join(",")}`);
  }
  app.handleUserMessage("手伝う人は主に1人です。", { choiceLabels: ["主に1人で手伝う"] });
  app.handleUserMessage("安全と清潔を大事にしたいです。", { choiceLabels: ["転倒や事故を防ぐ", "清潔を保ちたい"] });
  answerDefaultEnvironment(app);
  const categoryIds = topCategoryIds(app, 5);
  assert.ok(categoryIds.includes("toilet-rail"), `expected toilet-rail in ${categoryIds.join(",")}`);
  assert.ok(categoryIds.includes("toilet-seat"), `expected toilet-seat in ${categoryIds.join(",")}`);
  assert.ok(!categoryIds.every((categoryId) => ["toilet-pad", "toilet-clean"].includes(categoryId)), `toilet candidates should not be only pad/clean: ${categoryIds.join(",")}`);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("住宅改修で困っています。", { choiceLabel: "住宅改修" });
  const stepChoice = choiceButtons(elements).find((choice) => choice.label.includes("段差でつまずく"));
  assert.ok(stepChoice);
  assert.ok(stepChoice.itemIds.includes("house-slope"), `step choice should include house-slope, got ${stepChoice.itemIds.join(",")}`);
  assert.ok(stepChoice.itemIds.includes("house-rail"), `step choice should include house-rail, got ${stepChoice.itemIds.join(",")}`);
  app.handleUserMessage(stepChoice.value, { itemIds: stepChoice.itemIds, choiceLabels: [stepChoice.label] });
  app.handleUserMessage("手伝う人は主に1人です。", { choiceLabels: ["主に1人で手伝う"] });
  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。", { choiceLabels: ["転倒や事故を防ぐ"] });
  app.handleUserMessage("賃貸などの理由で、壁や床に穴を開ける工事は難しいです。", { choiceLabels: ["工事は難しい"] });
  const categoryIds = topCategoryIds(app, 5);
  assert.ok(categoryIds.includes("house-slope"), `expected house-slope in ${categoryIds.join(",")}`);
  assert.ok(categoryIds.includes("house-rail"), `expected handrail support in ${categoryIds.join(",")}`);
}

{
  const { app } = createApp();
  const requiredMetaFields = [
    "useWhen",
    "avoidWhen",
    "requiredAbilities",
    "caregiver",
    "noCaregiverFit",
    "selfSupport",
    "caregiverRelief",
    "environment",
    "insurance"
  ];

  for (const categoryId of Object.keys(app.CatalogProducts)) {
    const meta = app.CatalogProductCategoryMeta[categoryId];
    assert.ok(meta, `${categoryId} needs category decision metadata`);
    for (const field of requiredMetaFields) {
      assert.ok(field in meta, `${categoryId} needs ${field}`);
    }
    assert.equal(typeof meta.noCaregiverFit, "boolean", `${categoryId} noCaregiverFit must be boolean`);
    assert.equal(typeof meta.selfSupport, "boolean", `${categoryId} selfSupport must be boolean`);
    assert.equal(typeof meta.caregiverRelief, "boolean", `${categoryId} caregiverRelief must be boolean`);
    assert.equal(typeof meta.insurance.rental, "boolean", `${categoryId} insurance.rental must be boolean`);
  }
}

{
  const { app } = createApp();
  assert.equal(app.CatalogData.meta.defaultPage, 1);
  assert.equal(app.CatalogData.meta.defaultPdfPage, 3);
  assert.equal(app.CatalogData.meta.pdfPageCount, 94);
  assert.equal(app.CatalogData.meta.pageMap[1], 3);
  assert.equal(app.CatalogData.meta.pageMap[50], 52);
  assert.equal(app.catalogPageHref({ page: 50, pdfPage: 52 }), "acolclub.pdf#page=52");
  assert.equal(app.catalogPageHref({ page: 50 }), "acolclub.pdf#page=52");
  assert.equal(typeof app.openInsuranceGuide, "function");
  assert.equal(app.CatalogData.meta.insuranceGuide.title, "介護保険利用の流れ");
  assert.equal(app.CatalogData.meta.insuranceGuide.pdfPage, 2);
  assert.equal(app.CatalogData.meta.insuranceGuide.catalogPageImage, "assets/catalog-pages/page-002.jpg");
  assert.ok(fs.existsSync(app.CatalogData.meta.insuranceGuide.catalogPageImage), "insurance guide image should exist");
  assert.equal(typeof app.catalogPageImagePath, "function");
  assert.equal(typeof app.renderCatalogPageButton, "function");
  assert.equal(app.catalogPageImagePath({ page: 50, pdfPage: 52 }), "assets/catalog-pages/page-052.jpg");
  assert.equal(app.catalogPageImagePath({ page: 50 }), "assets/catalog-pages/page-052.jpg");

  for (const products of Object.values(app.CatalogProducts)) {
    for (const product of products) {
      assert.ok("pdfPage" in product, `${product.name} needs pdfPage for PDF link`);
      assert.equal(product.pdfPage, product.page + 2, `${product.name} should keep printed page and PDF page separated`);
      if (!product.catalogUnavailable) {
        const catalogImage = app.catalogPageImagePath(product);
        assert.ok(catalogImage, `${product.name} needs catalog page image mapping`);
        assert.ok(fs.existsSync(catalogImage), `${product.name} catalog page image should exist: ${catalogImage}`);
      }
    }
  }

  const bed = app.CatalogProducts["bed-care-bed"][0];
  assert.equal(bed.page, 4);
  assert.equal(bed.pdfPage, 6);
  const quola = app.CatalogProducts["bed-care-bed"].find((product) => product.name === "クオラONE");
  assert.equal(quola.page, 5);
  assert.equal(quola.pdfPage, 7);
  const walker = app.CatalogProducts["mob-walker"].find((product) => product.name === "セーフティーアームウォーカー");
  assert.equal(walker.page, 30);
  assert.equal(walker.pdfPage, 32);
  const stand = app.CatalogProducts["daily-stand"].find((product) => product.name === "たちあっぷ CKAシリーズ");
  assert.equal(stand.page, 50);
  assert.equal(stand.pdfPage, 52);
  const monitor = app.CatalogProducts["daily-monitor"][0];
  assert.equal(monitor.page, 86);
  assert.equal(monitor.pdfPage, 88);

  const catalogButtonHtml = app.renderCatalogPageButton(stand);
  assert.match(catalogButtonHtml, /<button[^>]+type="button"[^>]+class="[^"]*product-catalog-button[^"]*"/);
  assert.match(catalogButtonHtml, /data-catalog-page-image="assets\/catalog-pages\/page-052\.jpg"/);
  assert.match(catalogButtonHtml, /data-catalog-page-title="カタログ P50"/);
  assert.match(catalogButtonHtml, />\s*カタログ\s+P50を開く\s*<\/button>/);
  assert.doesNotMatch(catalogButtonHtml, /href="acolclub\.pdf#page=/);

  const unavailableProduct = app.CatalogProducts["bath-shower-chair"][0];
  assert.equal(app.renderCatalogPageButton(unavailableProduct), "");
}

{
  const { app } = createApp();
  const rentalCost = app.renderProductCost({
    categoryId: "mob-walker",
    price: "",
    insurance: { rental: true, purchase: false, privatePay: false }
  });
  assert.match(rentalCost, /価格:\s*貸与価格は事業所確認/);
  assert.match(rentalCost, /介護保険レンタル対象/);
  assert.match(rentalCost, /月額目安/);
  assert.match(rentalCost, /<li>1割:\s*200円〜500円\/月<\/li>/);
  assert.match(rentalCost, /<li>2割:\s*400円〜1,000円\/月<\/li>/);
  assert.match(rentalCost, /<li>3割:\s*600円〜1,500円\/月<\/li>/);
  assert.doesNotMatch(rentalCost, /円\/月（1割）/);
  assert.doesNotMatch(rentalCost, /価格:\s*カタログ確認/);

  const purchaseCost = app.renderProductCost({
    categoryId: "bath-shower-chair",
    price: "",
    catalogUnavailable: true,
    insurance: { rental: false, purchase: true, privatePay: true }
  });
  assert.match(purchaseCost, /価格:\s*別カタログ確認/);
  assert.match(purchaseCost, /購入対象・自費対象|購入・住宅改修・自費扱い/);
  assert.doesNotMatch(purchaseCost, /価格:\s*カタログ確認/);

  const housingCost = app.renderProductCost({
    categoryId: "house-step",
    price: "",
    insurance: { rental: false, purchase: true, privatePay: true }
  });
  assert.match(housingCost, /住宅改修・購入対象の可能性あり|購入・自費扱い/);
  assert.doesNotMatch(housingCost, /価格:\s*カタログ確認/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("入浴で困っています。本人は立つ座る歩くは少しできますがふらつきます。介助者は1人です。安全にしたいです。");
  let html = lastAssistantHtml(elements);
  assert.match(html, /使う場所の広さや条件に近いもの/);
  assert.match(html, /広さはおおむね確保できる/);
  assert.doesNotMatch(html, /候補商品の比較/);
  assert.equal(app.state.recommendations.length, 0);

  answerDefaultEnvironment(app);
  html = lastAssistantHtml(elements);
  assert.match(html, /候補商品の比較/);
  assert.ok(app.state.recommendations.length > 0);
  assert.match(html, /今回の条件/);
  assert.doesNotMatch(html, /状況の整理/);
  assert.doesNotMatch(html, /アセスメント/);
  assert.match(html, /1\. 候補商品の比較/);
  assert.match(html, /<th>商品名<\/th>/);
  assert.match(html, /<th>種類<\/th>/);
  assert.match(html, /<th>向いている人<\/th>/);
  assert.match(html, /<th>価格<\/th>/);
  assert.doesNotMatch(html, /<th>詳細<\/th>/);
  assert.doesNotMatch(html, /data-label="詳細"/);
  assert.doesNotMatch(html, /<th>確認すること<\/th>/);
  assert.doesNotMatch(html, /data-label="確認すること"/);
  assert.match(html, /2\. いちばん合いそうな商品/);
  assert.match(html, /まずはご相談ください/);
  assert.match(html, /3\. まずはご相談ください/);
  assert.match(html, /tel:09095763944/);
  assert.match(html, /090-9576-3944/);
  assert.doesNotMatch(html, /次にやること/);
  assert.doesNotMatch(html, /参照:/);
  assert.match(html, /概要を見る/);
  assert.match(html, /<dt>特徴<\/dt>/);
  assert.match(html, /<dt>向いている状態<\/dt>/);
  assert.match(html, /<dt>注意点<\/dt>/);
  assert.match(html, /<dt>レンタル・購入区分<\/dt>/);
  assert.match(html, /<dt>カタログリンク<\/dt>/);
  assert.match(html, /カタログ\s+P\d+を開く/);
  assert.match(html, /カタログ\s+P\d+を開く[\s\S]*相談リストに追加[\s\S]*概要を見る/);
  assert.match(html, /<button[^>]+class="[^"]*product-catalog-button[^"]*"[^>]+data-catalog-page-image="assets\/catalog-pages\/page-\d{3}\.jpg"[^>]*>\s*カタログ\s+P\d+を開く\s*<\/button>/);
  assert.doesNotMatch(html, /href="acolclub\.pdf#page=/);
}

{
  const { app } = createApp();
  assert.equal(typeof app.renderProductImage, "function");
  assert.equal(typeof app.showCatalogPageModal, "function");

  const imageProduct = app.CatalogProducts["bath-tub-rail"].find((product) => product.name.includes("たちあっぷ"));
  assert.equal(imageProduct.image, "assets/product-images/tachiup-cka.jpg");
  assert.ok(fs.existsSync(imageProduct.image), "product image file should exist");

  const imageHtml = app.renderProductImage(imageProduct);
  assert.match(imageHtml, /<button[^>]+type="button"[^>]+data-product-image-src="assets\/product-images\/tachiup-cka\.jpg"/);
  assert.match(imageHtml, /data-product-image-title="たちあっぷ CKAシリーズ"/);
  assert.match(imageHtml, /<img[^>]+class="[^"]*product-image[^"]*"/);
  assert.match(imageHtml, /src="assets\/product-images\/tachiup-cka\.jpg"/);
  assert.match(imageHtml, /alt="たちあっぷ CKAシリーズの商品画像"/);
  assert.doesNotMatch(imageHtml, /href="acolclub\.pdf#page=52"/);

  const noImageProduct = app.CatalogProducts["bath-shower-chair"][0];
  assert.equal(app.renderProductImage(noImageProduct), "");
}

{
  const css = fs.readFileSync("styles.css", "utf8");
  assert.match(css, /\.catalog-page-modal\s*{[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.catalog-page-modal-card\s*{[\s\S]*width:\s*min\(100%,\s*1200px\)/);
  assert.match(css, /\.catalog-page-modal-card img\s*{[\s\S]*width:\s*100%/);
  assert.match(css, /\.catalog-page-modal-card img\s*{[\s\S]*height:\s*auto/);
  assert.doesNotMatch(css, /\.catalog-page-modal-card img\s*{[^}]*max-height/);
  assert.doesNotMatch(css, /\.catalog-page-modal-card img\s*{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.product-image-modal-card img\s*{[\s\S]*max-height:\s*72vh/);
  assert.match(css, /\.product-image-modal-card img\s*{[\s\S]*object-fit:\s*contain/);
}

{
  const { app } = createApp();
  const imagePendingProducts = new Set(["ケアスロープ", "お散歩コール"]);
  const missingImages = [];
  const pendingProducts = [];
  for (const products of Object.values(app.CatalogProducts)) {
    for (const product of products) {
      if (product.catalogUnavailable) continue;
      const imagePath = product.image || product.imageSrc || "";
      if (imagePendingProducts.has(product.name)) {
        pendingProducts.push(product.name);
        assert.equal(app.renderProductImage(product), "");
        continue;
      }
      if (!imagePath || !fs.existsSync(imagePath)) {
        missingImages.push(product.name);
      }
    }
  }
  assert.deepEqual(missingImages, []);
  assert.deepEqual([...new Set(pendingProducts)].sort(), ["お散歩コール", "ケアスロープ"]);
}

{
  const { elements, app, storage } = createApp();
  app.handleUserMessage("歩行器が欲しいです。");
  answerCommonRequired(app);
  let html = lastAssistantHtml(elements);
  assert.match(html, /相談リストに追加/);
  assert.match(html, /相談リスト/);
  assert.match(html, /まだ商品は追加されていません/);

  const product = app.state.recommendations[0];
  assert.equal(app.addToConsultationList(product), true);
  assert.equal(app.addToConsultationList(product), false);
  assert.equal(app.getConsultationList().length, 1);

  const listHtml = app.renderConsultationListHtml();
  assert.match(listHtml, new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(listHtml, /種類/);
  assert.match(listHtml, /カタログ/);
  assert.match(listHtml, /data-catalog-page-image="assets\/catalog-pages\/page-\d{3}\.jpg"/);
  assert.doesNotMatch(listHtml, /href="acolclub\.pdf#page=/);
  assert.match(listHtml, /削除/);
  assert.match(listHtml, /すべて削除/);
  assert.match(app.renderConsultationAddButton(product), /追加済み/);

  const saved = storage.getItem("welmo-consultation-list-v1");
  assert.ok(saved, "consultation list should be saved to localStorage");
  assert.match(saved, new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const key = app.consultationItemKey(app.getConsultationList()[0]);
  assert.equal(app.removeFromConsultationList(key), true);
  assert.equal(app.getConsultationList().length, 0);
  assert.match(app.renderConsultationListHtml(), /まだ商品は追加されていません/);

  app.addToConsultationList(product);
  app.clearConsultationList();
  assert.equal(app.getConsultationList().length, 0);
  assert.equal(storage.getItem("welmo-consultation-list-v1"), "[]");
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("トイレと浴室に手すり、浴室にシャワーチェアが欲しいです。");
  app.handleUserMessage("本人は立つ座る歩くは少しできますがふらつきます。介助者は1人です。安全にしたいです。");
  answerDefaultEnvironment(app);
  const html = lastAssistantHtml(elements);
  assert.match(html, /トイレ用手すり/);
  assert.match(html, /置き型手すり|浴室外手すり|たちあっぷ|スムーディ/);
  assert.match(html, /シャワーチェア/);
  assert.match(html, /src="assets\/product-images\/tachiup-cka\.jpg"/);
  assert.match(html, /alt="たちあっぷ CKAシリーズの商品画像"/);
  assert.match(html, /data-catalog-page-image="assets\/catalog-pages\/page-052\.jpg"[^>]*>\s*カタログ\s+P50を開く/);
  assert.match(html, /data-catalog-page-image="assets\/catalog-pages\/page-053\.jpg"[^>]*>\s*カタログ\s+P51を開く/);
  assert.doesNotMatch(html, /data-catalog-page-image="assets\/catalog-pages\/page-050\.jpg"[^>]*>\s*カタログ\s+P50を開く/);
  assert.doesNotMatch(html, /data-catalog-page-image="assets\/catalog-pages\/page-051\.jpg"[^>]*>\s*カタログ\s+P51を開く/);
  assert.doesNotMatch(html, /href="acolclub\.pdf#page=/);
  assert.doesNotMatch(html, /杖/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("トイレと浴室に手すり、浴室にシャワーチェアが欲しいです。");
  app.handleUserMessage("本人は立つ座る歩くは少しできますがふらつきます。介助者は1人です。安全にしたいです。");
  answerDefaultEnvironment(app);
  app.handleUserMessage("車いすも見たいです。");
  const html = lastAssistantHtml(elements);
  assert.match(firstCandidate(elements), /車いす|ふわりす|NAH|BAL|ネクストコア/);
  assert.match(html, /介護保険レンタル対象/);
  assert.match(html, /1割/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("トイレと浴室に手すり、浴室にシャワーチェアが欲しいです。");
  app.handleUserMessage("本人は立つ座る歩くは少しできますがふらつきます。介助者は1人です。安全にしたいです。");
  app.handleUserMessage("浴室が狭いので、シャワーチェアは小さいものがよいです。");
  const html = lastAssistantHtml(elements);
  assert.match(firstCandidate(elements), /シャワーチェア/);
  assert.doesNotMatch(html, /Acolclub掲載外|Acolclubレンタルカタログ掲載外/);
  assert.match(html, /介護保険では購入・住宅改修・自費扱い/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("ベッド周りで困っています。本人は自分で起き上がりたいです。介助者は1人です。安全にしたいです。");
  answerDefaultEnvironment(app);
  assert.match(firstCandidate(elements), /ベッド|楽匠|クオラ|Emi|CORE|グリップ|サイドレール/);
  app.handleUserMessage("歩行器もほしいです。");
  const html = lastAssistantHtml(elements);
  assert.match(firstCandidate(elements), /シンフォニー|リトルターン|ハッピー|セーフティーアーム/);
  assert.match(html, /歩行車/);
  assert.doesNotMatch(firstCandidate(elements), /ベッド|グリップ|サイドレール/);
}

{
  const { app } = createApp();
  app.handleUserMessage("ベッド周囲に手すりが欲しいです。");
  assert.ok(app.state.profile.latestItemIds.includes("bed-rail"));
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "bed-rail");
  assert.notEqual(firstCategoryId(app), "bed-lift");
  assert.notEqual(firstCategoryId(app), "mob-wheelchair");
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("ベッドサイドに置くタイプの手すりが欲しいです。工事なしで置けるものを見たいです。");
  assert.ok(app.state.profile.latestItemIds.includes("house-rail"));
  assert.ok(!app.state.profile.latestItemIds.includes("bed-rail"));
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "house-rail");
  assert.match(firstCandidate(elements), /たちあっぷ|ベスポジ|ルーツ|置き型/);
  assert.doesNotMatch(firstCandidate(elements), /ベッドサイドレール Kシリーズ/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("ベッド横に置く手すりがほしいです。ベッド柵ではなく置き型で考えています。");
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "house-rail");
  assert.doesNotMatch(firstCandidate(elements), /ベッドサイドレール Kシリーズ/);
}

{
  const { app } = createApp();
  app.handleUserMessage("ベッド横で立ち上がるための手すりが欲しいです。");
  answerCommonRequired(app);
  assert.ok(["bed-rail", "daily-stand", "house-rail"].includes(firstCategoryId(app)));
  assert.notEqual(firstCategoryId(app), "bed-lift");
}

{
  const { app } = createApp();
  app.handleUserMessage("ベッドから車いすへ移る時につかまる手すりが欲しいです。");
  assert.ok(app.state.profile.latestItemIds.includes("bed-rail"));
  assert.ok(!app.state.profile.latestItemIds.includes("mob-wheelchair"));
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "bed-rail");
  assert.notEqual(firstCategoryId(app), "mob-wheelchair");
  assert.ok(topCategoryIds(app).includes("bed-rail"));
}

{
  const { app } = createApp();
  app.handleUserMessage("抱え上げる介助が続いているのでリフトを見たいです。");
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "bed-lift");
}

{
  const { app } = createApp();
  app.handleUserMessage("ベッド周囲に手すりが欲しいです。");
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "bed-rail");
  app.handleUserMessage("車いすも見たいです。");
  assert.equal(firstCategoryId(app), "mob-wheelchair");
}

{
  const scenarios = [
    {
      text: "歩行器が欲しいです。",
      expected: "mob-walker",
      forbidden: "mob-cane"
    },
    {
      text: "歩行車が欲しいです。",
      expected: "mob-walker",
      forbidden: "mob-cane"
    },
    {
      text: "両手でしっかり支えたいです。",
      expected: "mob-walker",
      forbidden: "mob-cane"
    },
    {
      text: "片手の支えで歩きたいです。",
      expected: "mob-cane",
      forbidden: "mob-walker"
    }
  ];

  for (const scenario of scenarios) {
    const { elements, app } = createApp();
    app.handleUserMessage(scenario.text);
    assert.doesNotMatch(lastAssistantHtml(elements), /候補商品の比較/);
    assert.ok(app.state.profile.latestItemIds.includes(scenario.expected), `${scenario.text} should detect ${scenario.expected}`);
    answerCommonRequired(app);
    assert.equal(firstCategoryId(app), scenario.expected, `${scenario.text} should recommend ${scenario.expected} first`);
    assert.notEqual(firstCategoryId(app), scenario.forbidden, `${scenario.text} should not recommend ${scenario.forbidden} first`);
  }
}

{
  const { app } = createApp();
  app.handleUserMessage("ベッド周りで困っています。本人は自分で起き上がりたいです。");
  answerCommonRequired(app);
  assert.match(firstCategoryId(app), /bed-/);
  app.handleUserMessage("歩行器もほしいです。");
  assert.equal(firstCategoryId(app), "mob-walker");
  assert.notEqual(firstCategoryId(app), "mob-cane");
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("歩行器がほしいです。");
  const wobbleChoice = choiceButtons(elements).find((choice) => choice.label.includes("家の中でふらつく"));
  assert.ok(wobbleChoice);
  app.handleUserMessage(wobbleChoice.value, { itemIds: wobbleChoice.itemIds, choiceLabel: wobbleChoice.label });
  app.handleUserMessage("手伝う人は1人です。");
  app.handleUserMessage("安全を優先して選びたいです。");
  answerDefaultEnvironment(app);
  assert.equal(firstCategoryId(app), "mob-walker");
  assert.notEqual(firstCategoryId(app), "mob-cane");
  assert.doesNotMatch(lastAssistantHtml(elements), /ロフストランドクラッチ/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("片手の支えで歩きたいです。");
  answerCommonRequired(app);
  assert.equal(firstCategoryId(app), "mob-cane");
  assert.match(lastAssistantHtml(elements), /テトラ・ケイン/);
  assert.match(lastAssistantHtml(elements), /src="assets\/product-images\/tetra-cane\.jpg"/);
  assert.doesNotMatch(lastAssistantHtml(elements), /ロフストランドクラッチ/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("入浴で困っています。");
  const movingChoice = choiceButtons(elements).find((choice) => choice.label.includes("浴室内の移動が難しい"));
  assert.ok(movingChoice);
  app.handleUserMessage(movingChoice.value, { itemIds: movingChoice.itemIds });
  app.handleUserMessage("日中や夜間に本人だけになる時間が多いです。");
  app.handleUserMessage("できるだけ本人が自分でできるようにしたいです。");
  answerDefaultEnvironment(app);
  assert.notEqual(firstCategoryId(app), "bath-shower-carry");
  assert.ok(["bath-shower-chair", "bath-tub-rail", "bath-tub-step"].includes(firstCategoryId(app)));
  assert.doesNotMatch(firstCandidate(elements), /シャワーキャリー|シャワー用車いす|浴用キャリー/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("毎日の生活動作で困っています。");
  const standChoice = choiceButtons(elements).find((choice) => choice.label.includes("椅子や床から立ち上がりにくい"));
  assert.ok(standChoice);
  app.handleUserMessage(standChoice.value, { itemIds: standChoice.itemIds });
  app.handleUserMessage("直接手伝うより、見守りや声かけが中心です。");
  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。");
  answerDefaultEnvironment(app);
  assert.equal(firstCategoryId(app), "daily-stand");
  assert.doesNotMatch(firstCandidate(elements), /電話着信|見守りセンサー/);
}

{
  const scenarios = [
    {
      sceneSeed: "入浴で困っています。",
      choiceLabel: "洗い場で立つと不安",
      expectedIds: ["bath-shower-chair"]
    },
    {
      sceneSeed: "入浴で困っています。",
      choiceLabel: "浴槽をまたぐのが不安",
      expectedIds: ["bath-tub-rail", "bath-tub-step"]
    },
    {
      sceneSeed: "排泄で困っています。",
      choiceLabel: "便座に座る・立つ時が不安",
      expectedIds: ["toilet-rail", "toilet-seat"]
    },
    {
      sceneSeed: "食事で困っています。",
      choiceLabel: "むせる・飲み込みが不安",
      expectedIds: ["meal-thickener"]
    },
    {
      sceneSeed: "毎日の生活動作で困っています。",
      choiceLabel: "椅子や床から立ち上がりにくい",
      expectedIds: ["daily-stand"]
    }
  ];

  for (const scenario of scenarios) {
    const { elements, app } = createApp();
    app.handleUserMessage(scenario.sceneSeed);
    const choice = choiceButtons(elements).find((candidate) => candidate.label.includes(scenario.choiceLabel));
    assert.ok(choice, scenario.choiceLabel);
    app.handleUserMessage(choice.value, { itemIds: choice.itemIds });
    app.handleUserMessage("手伝う人は主に1人です。");
    app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。");
    answerDefaultEnvironment(app);
    assert.ok(
      scenario.expectedIds.includes(firstCategoryId(app)),
      `${scenario.choiceLabel}: expected ${scenario.expectedIds.join(",")} but got ${firstCategoryId(app)}`
    );
  }
}

{
  const scenarios = [
    {
      text: "浴槽をまたぐのが不安です。",
      expectedIds: ["bath-tub-rail", "bath-tub-step"],
      forbiddenIds: ["mob-cane", "mob-wheelchair"]
    },
    {
      text: "洗い場で立つと不安です。",
      expectedIds: ["bath-shower-chair"],
      forbiddenIds: ["mob-cane", "mob-wheelchair"]
    },
    {
      text: "便座が低く立ち上がりにくいです。",
      expectedIds: ["toilet-seat"],
      forbiddenIds: ["mob-cane", "mob-wheelchair"]
    },
    {
      text: "夜間トイレまで間に合わないのでポータブルトイレが欲しいです。",
      expectedIds: ["toilet-portable"],
      forbiddenIds: ["mob-cane", "mob-wheelchair"]
    },
    {
      text: "夜間の見守りセンサーが欲しいです。",
      expectedIds: ["daily-monitor"],
      forbiddenIds: ["toilet-rail", "mob-cane"]
    },
    {
      text: "廊下に手すりが欲しいです。",
      expectedIds: ["house-rail"],
      forbiddenIds: ["mob-cane", "mob-wheelchair"]
    },
    {
      text: "玄関の段差にスロープが欲しいです。",
      expectedIds: ["mob-slope", "house-slope"],
      forbiddenIds: ["mob-cane"]
    }
  ];

  for (const scenario of scenarios) {
    const { app } = createApp();
    app.handleUserMessage(scenario.text);
    assert.ok(
      app.state.profile.latestItemIds.some((itemId) => scenario.expectedIds.includes(itemId)),
      `${scenario.text}: expected latest item to include ${scenario.expectedIds.join(",")}, got ${app.state.profile.latestItemIds.join(",")}`
    );
    answerCommonRequired(app);
    assert.ok(
      scenario.expectedIds.includes(firstCategoryId(app)),
      `${scenario.text}: expected ${scenario.expectedIds.join(",")} but got ${firstCategoryId(app)}`
    );
    for (const forbiddenId of scenario.forbiddenIds) {
      assert.ok(!topCategoryIds(app).includes(forbiddenId), `${scenario.text}: should not include ${forbiddenId} in top categories`);
    }
  }
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("食事で困っています。");
  let html = lastAssistantHtml(elements);
  assert.match(html, /食べる場面で困っていることに近いもの/);
  assert.match(html, /data-choice-text/);
  assert.match(html, /むせる・飲み込みが不安/);
  assert.match(html, /姿勢が崩れやすい/);
  assert.match(html, /その他・近いものがない/);
  assert.doesNotMatch(html, /立つ・座る・歩く/);
  assert.doesNotMatch(html, /手伝う人は何人/);
  assert.match(elements.factGrid.innerHTML, /食事で困ること/);
  assert.match(elements.factGrid.innerHTML, /食事/);
  assert.doesNotMatch(elements.factGrid.innerHTML, /できること・難しいこと/);

  app.handleUserMessage("むせることと食べこぼしがあります。介助者は1人です。安全に食べたいです。");
  answerDefaultEnvironment(app);
  html = lastAssistantHtml(elements);
  assert.match(firstCandidate(elements), /とろみ|水分補給ゼリー|嚥下/);
  assert.match(html, /食事/);
  assert.doesNotMatch(html, /杖/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("食事で困っています。");
  const chokeChoice = choiceButtons(elements).find((choice) => choice.label.includes("むせる・飲み込みが不安"));
  assert.ok(chokeChoice);
  app.handleUserMessage(chokeChoice.value, { itemIds: chokeChoice.itemIds });
  app.handleUserMessage("食事の手伝いは主に1人です。そばで確認や声かけをしています。");
  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。");
  answerDefaultEnvironment(app);
  const html = lastAssistantHtml(elements);
  assert.ok(topCategoryIds(app).every((categoryId) => categoryId.startsWith("meal-")));
  assert.doesNotMatch(html, /杖|歩行車|車いす|車椅子/);
}

{
  const { elements, app } = createApp();
  app.handleUserMessage("食事で困っています。");
  app.handleUserMessage("食事中にむせることがあります。飲み込みが不安で、とろみも検討したいです。");
  assert.match(lastAssistantHtml(elements), /食事の手伝いをする人の状況に近いもの/);
  assert.match(lastAssistantHtml(elements), /主に1人で付き添う/);
  assert.match(lastAssistantHtml(elements), /まだ分からない/);

  app.handleUserMessage("食事の手伝いは主に1人です。そばで確認や声かけをしています。");
  assert.match(lastAssistantHtml(elements), /今回いちばん大事にしたいことに近いもの/);
  assert.match(lastAssistantHtml(elements), /本人が自分でできる/);
  assert.match(lastAssistantHtml(elements), /まだ決めきれていない/);

  app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。");
  assert.match(lastAssistantHtml(elements), /使う場所の広さや条件に近いもの/);
  answerDefaultEnvironment(app);
  const html = lastAssistantHtml(elements);
  assert.match(firstCandidate(elements), /とろみ|水分補給ゼリー|嚥下/);
  assert.match(html, /候補商品の比較/);
  assert.doesNotMatch(html, /杖/);
}

{
  const sceneSeeds = [
    "入浴で困っています。",
    "排泄で困っています。",
    "移動や歩行で困っています。",
    "ベッド周りで困っています。",
    "食事で困っています。",
    "住宅改修や家の中の動線で困っています。",
    "毎日の生活動作で困っています。"
  ];

  for (const seed of sceneSeeds) {
    const { elements, app } = createApp();
    app.handleUserMessage(seed);
    let text = stripHtml(lastAssistantHtml(elements));
    assert.match(text, /近いものを選んでください/);
    assert.match(text, /その他・近いものがない/);
    assert.doesNotMatch(text, /手伝う人は何人/);
    assert.doesNotMatch(text, /どの手伝いがいちばん大変/);
    assert.ok((text.match(/？/g) || []).length <= 1);

    app.handleUserMessage("選択肢に近いものがありません。今の情報で広めに候補を見たいです。");
    text = stripHtml(lastAssistantHtml(elements));
    assert.match(text, /手伝いをする人の状況に近いもの|手伝う人の状況に近いもの/);
    assert.match(text, /まだ分からない/);
    assert.ok((text.match(/？/g) || []).length <= 1);

    app.handleUserMessage("手伝う人の状況はまだはっきり分かりません。");
    text = stripHtml(lastAssistantHtml(elements));
    assert.match(text, /今回いちばん大事にしたいことに近いもの/);
    assert.match(text, /まだ決めきれていない/);
    assert.ok((text.match(/？/g) || []).length <= 1);

    app.handleUserMessage("優先したいことはまだ決めきれていません。安全性と使いやすさを見ながら考えたいです。");
    text = stripHtml(lastAssistantHtml(elements));
    assert.match(text, /使う場所の広さや条件に近いもの/);
    assert.match(text, /広さはおおむね確保できる/);
    assert.doesNotMatch(text, /候補商品の比較/);
    assert.ok((text.match(/？/g) || []).length <= 1);
  }
}

{
  const sceneSeeds = [
    "入浴で困っています。",
    "排泄で困っています。",
    "移動や歩行で困っています。",
    "ベッド周りで困っています。",
    "食事で困っています。",
    "住宅改修や家の中の動線で困っています。",
    "毎日の生活動作で困っています。"
  ];

  for (const sceneSeed of sceneSeeds) {
    const setup = createApp();
    setup.app.handleUserMessage(sceneSeed);
    for (const choice of choiceButtons(setup.elements)) {
      if (choice.label.includes("その他")) continue;
      assert.ok(choice.itemIds.length > 0, `${sceneSeed} / ${choice.label} needs itemIds`);

      const run = createApp();
      run.app.handleUserMessage(sceneSeed);
      run.app.handleUserMessage(choice.value, { itemIds: choice.itemIds });
      run.app.handleUserMessage("手伝う人は主に1人です。");
      run.app.handleUserMessage("安全を優先して、転倒や事故を防ぎたいです。");
      answerDefaultEnvironment(run.app);
      assert.ok(
        choice.itemIds.includes(firstCategoryId(run.app)),
        `${sceneSeed} / ${choice.label}: expected ${choice.itemIds.join(",")} but got ${firstCategoryId(run.app)}`
      );
    }
  }
}

{
  const sceneSeeds = [
    "入浴で困っています。",
    "排泄で困っています。",
    "移動や歩行で困っています。",
    "ベッド周りで困っています。",
    "食事で困っています。",
    "住宅改修や家の中の動線で困っています。",
    "毎日の生活動作で困っています。"
  ];

  for (const sceneSeed of sceneSeeds) {
    const setup = createApp();
    setup.app.handleUserMessage(sceneSeed);
    for (const choice of choiceButtons(setup.elements)) {
      if (!choice.itemIds.some((itemId) => handsOnCaregiverItemIds.has(itemId))) continue;

      const run = createApp();
      run.app.handleUserMessage(sceneSeed);
      run.app.handleUserMessage(choice.value, { itemIds: choice.itemIds });
      run.app.handleUserMessage("日中や夜間に本人だけになる時間が多いです。");
      run.app.handleUserMessage("できるだけ本人が自分でできるようにしたいです。");
      answerDefaultEnvironment(run.app);
      assert.ok(
        !handsOnCaregiverItemIds.has(firstCategoryId(run.app)),
        `${sceneSeed} / ${choice.label}: first category should not require hands-on caregiver, got ${firstCategoryId(run.app)}`
      );
    }
  }
}

console.log("conversation engine tests passed");
