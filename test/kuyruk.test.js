"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { siradaki, ilerleme, hikayeParcalari } = require("../kuyruk.js");

const K = [{ id: "a", sira: 1 }, { id: "b", sira: 2 }, { id: "c", sira: 3 }];

test("siradaki: başlangıçta ilk öğrenilmemiş kelime", () => {
  assert.equal(siradaki(K, {}, null, 1).id, "a");
});

test("siradaki: ileri gider ve sondan başa sarar", () => {
  assert.equal(siradaki(K, {}, "a", 1).id, "b");
  assert.equal(siradaki(K, {}, "c", 1).id, "a");
});

test("siradaki: geri gider ve baştan sona sarar", () => {
  assert.equal(siradaki(K, {}, "a", -1).id, "c");
});

test("siradaki: öğrenilenleri atlar", () => {
  assert.equal(siradaki(K, { b: true }, "a", 1).id, "c");
});

test("siradaki: az önce tiklenen kelimeden sonrakine geçer", () => {
  assert.equal(siradaki(K, { b: true }, "b", 1).id, "c");
});

test("siradaki: kelime kalmayınca null", () => {
  assert.equal(siradaki(K, { a: true, b: true, c: true }, "a", 1), null);
  assert.equal(siradaki([], {}, null, 1), null);
});

test("ilerleme: yalnızca listedeki tikleri sayar", () => {
  assert.deepEqual(ilerleme(K, { a: true, zzz: true }), { ogrenilen: 1, toplam: 3 });
});

test("hikayeParcalari: ** arası kalın", () => {
  assert.deepEqual(hikayeParcalari("Ali **kedi** sever"), [
    { metin: "Ali ", kalin: false },
    { metin: "kedi", kalin: true },
    { metin: " sever", kalin: false },
  ]);
});

test("hikayeParcalari: kapanmamış ** düz kalır", () => {
  assert.deepEqual(hikayeParcalari("a **b"), [
    { metin: "a ", kalin: false },
    { metin: "b", kalin: false },
  ]);
});
