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

// Sahip tiki: taze sha ile doğrudan yazar, yalnızca 409'da yeniden okur
const { tikEkle, yazabilir } = require("../kuyruk.js");
function sahte(yanitlar, okunan) {
  const g = { okuma: 0, yazilan: [], bekle: () => Promise.resolve(), deneme: 3 };
  g.oku = () => { g.okuma++; return Promise.resolve(okunan); };
  g.yaz = (t, sha) => { g.yazilan.push(sha); return Promise.resolve(yanitlar.shift()); };
  return g;
}

test("tikEkle: elde sha varsa okumadan yazar", async () => {
  const g = sahte([{ status: 200, sha: "s2" }], null);
  const d = await tikEkle({ tikler: { a: true }, sha: "s1" }, "b", g);
  assert.equal(g.okuma, 0);
  assert.deepEqual(g.yazilan, ["s1"]);
  assert.deepEqual(d, { tikler: { a: true, b: true }, sha: "s2" });
});

test("tikEkle: sha yoksa önce okur", async () => {
  const g = sahte([{ status: 201, sha: "s3" }], { tikler: {}, sha: "s1" });
  const d = await tikEkle({ tikler: {}, sha: null }, "a", g);
  assert.equal(g.okuma, 1);
  assert.deepEqual(d, { tikler: { a: true }, sha: "s3" });
});

test("tikEkle: 409'da yeniden okuyup okunan tiklerin üstüne yazar", async () => {
  const g = sahte([{ status: 409 }, { status: 200, sha: "s9" }], { tikler: { x: true }, sha: "s5" });
  const d = await tikEkle({ tikler: {}, sha: "eski" }, "a", g);
  assert.deepEqual(g.yazilan, ["eski", "s5"]);
  assert.deepEqual(d, { tikler: { x: true, a: true }, sha: "s9" });
});

test("tikEkle: deneme bitince 409 hatası", async () => {
  const g = sahte([{ status: 409 }, { status: 409 }, { status: 409 }, { status: 409 }], { tikler: {}, sha: "s" });
  await assert.rejects(tikEkle({ tikler: {}, sha: "s0" }, "a", g), { message: "409" });
  assert.equal(g.yazilan.length, 4);
});

test("tikEkle: 401 tekrar denenmez", async () => {
  const g = sahte([{ status: 401 }], null);
  await assert.rejects(tikEkle({ tikler: {}, sha: "s0" }, "a", g), { message: "401" });
  assert.equal(g.yazilan.length, 1);
});

test("yazabilir: yalnızca push yetkisi varsa true", () => {
  assert.equal(yazabilir({ permissions: { push: true } }), true);
  assert.equal(yazabilir({ permissions: { push: false, pull: true } }), false);
  assert.equal(yazabilir({}), false);
});

// Her açılışta rastgele sıra: sira 1..n yeniden dağıtılır, girdi değişmez
const { karistir } = require("../kuyruk.js");

test("karistir: aynı kelimeler, sira 1..n, girdi bozulmaz", () => {
  const giris = [{ id: "a", sira: 1 }, { id: "b", sira: 2 }, { id: "c", sira: 3 }, { id: "d", sira: 4 }];
  const k = karistir(giris, () => 0);
  assert.deepEqual(k.map((x) => x.id).sort(), ["a", "b", "c", "d"]);
  assert.deepEqual(k.map((x) => x.sira).sort(), [1, 2, 3, 4]);
  assert.deepEqual(giris.map((x) => x.sira), [1, 2, 3, 4]);
});

test("karistir: sırayı rastgele sayıya göre değiştirir", () => {
  const k = karistir(K, () => 0); // Fisher–Yates, hep 0: a b c -> b c a
  assert.deepEqual(k.slice().sort((x, y) => x.sira - y.sira).map((x) => x.id), ["b", "c", "a"]);
  assert.equal(siradaki(k, {}, null, 1).id, "b");
});
