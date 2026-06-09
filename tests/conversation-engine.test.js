const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createApp() {
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
  const context = {
    console,
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
      "globalThis.__test = { handleUserMessage, state, CatalogProducts, CatalogProductCategoryMeta, CatalogData, catalogPageHref };"
    ].join("\n"),
    context
  );
  return { elements, app: context.__test };
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

const handsOnCaregiverItemIds = new Set([
  "bath-transfer-board",
  "bath-shower-carry",
  "bed-transfer-glove",
  "bed-lift"
]);

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

  for (const products of Object.values(app.CatalogProducts)) {
    for (const product of products) {
      assert.ok("pdfPage" in product, `${product.name} needs pdfPage for PDF link`);
      assert.equal(product.pdfPage, product.page + 2, `${product.name} should keep printed page and PDF page separated`);
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
  assert.match(html, /href="acolclub\.pdf#page=52"[^>]*>\s*カタログ\s+P50を開く/);
  assert.match(html, /href="acolclub\.pdf#page=53"[^>]*>\s*カタログ\s+P51を開く/);
  assert.doesNotMatch(html, /href="acolclub\.pdf#page=50"[^>]*>\s*カタログ\s+P50を開く/);
  assert.doesNotMatch(html, /href="acolclub\.pdf#page=51"[^>]*>\s*カタログ\s+P51を開く/);
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
  assert.match(firstCandidate(elements), /シャワーチェア|Acolclubレンタルカタログ掲載外/);
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
