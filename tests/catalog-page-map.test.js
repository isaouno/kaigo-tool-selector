const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {};
vm.createContext(context);
vm.runInContext(
  [
    fs.readFileSync("catalog-data.js", "utf8"),
    fs.readFileSync("product-data.js", "utf8"),
    "globalThis.__test = { CatalogData, CatalogProducts };"
  ].join("\n"),
  context
);

const { CatalogData, CatalogProducts } = context.__test;
const { pageMap, pdfPageCount } = CatalogData.meta;

assert.equal(CatalogData.meta.pdf, "acolclub.pdf");
assert.equal(pdfPageCount, 94);
assert.equal(pageMap[1], 3);
assert.equal(pageMap[90], 92);

for (const [categoryId, products] of Object.entries(CatalogProducts)) {
  for (const product of products) {
    assert.equal(Number.isInteger(product.page), true, `${categoryId}/${product.name} needs printed page`);
    assert.equal(Number.isInteger(product.pdfPage), true, `${categoryId}/${product.name} needs PDF page`);
    assert.ok(product.pdfPage >= 1, `${categoryId}/${product.name} pdfPage must be positive`);
    assert.ok(product.pdfPage <= pdfPageCount, `${categoryId}/${product.name} pdfPage exceeds PDF page count`);
    assert.equal(
      product.pdfPage,
      pageMap[product.page],
      `${categoryId}/${product.name} should link by printed page -> PDF page map`
    );
  }
}

const verifiedProducts = [
  ["bed-care-bed", "クオラONE", 5, 7],
  ["bed-pressure", "ソフティアマットレス", 16, 18],
  ["bed-pressure", "ゼロソア アコーネ", 18, 20],
  ["bed-pressure", "アルファプラ すくっとRe", 19, 21],
  ["mob-walker", "セーフティーアームウォーカー", 30, 32],
  ["mob-walker", "ハッピーII", 33, 35],
  ["mob-walker", "シンフォニーSP", 34, 36],
  ["mob-walker", "リトルターン", 35, 37],
  ["toilet-rail", "スムーディ トイレ用", 51, 53],
  ["house-rail", "ベスポジ-e", 39, 41],
  ["house-rail", "ルーツ", 43, 45],
  ["daily-stand", "たちあっぷ CKAシリーズ", 50, 52],
  ["bed-lift", "つるべー", 83, 85],
  ["daily-monitor", "家族コール3", 86, 88]
];

for (const [categoryId, name, page, pdfPage] of verifiedProducts) {
  const product = CatalogProducts[categoryId].find((item) => item.name === name);
  assert.ok(product, `${categoryId}/${name} should exist`);
  assert.equal(product.page, page, `${categoryId}/${name} printed page`);
  assert.equal(product.pdfPage, pdfPage, `${categoryId}/${name} PDF page`);
}

console.log("Catalog page map tests passed");
