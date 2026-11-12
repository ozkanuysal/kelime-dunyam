// Kart sırası: hangi kelime gösterilecek, ilerleme ve hikâyedeki kalın parçalar.
// Tarayıcıda window.Kuyruk, Node'da module.exports olarak gelir.
(function (kok) {
  "use strict";

  function siraya(a, b) { return (a.sira || 0) - (b.sira || 0); }

  // simdikiId'den sonraki (yon=1) ya da önceki (yon=-1) öğrenilmemiş kelime; uçlarda sarar.
  // simdikiId tiklenmiş olsa bile onun sırasına göre ilerler. Kelime kalmadıysa null.
  function siradaki(kelimeler, tikler, simdikiId, yon) {
    var kalan = kelimeler.filter(function (k) { return !tikler[k.id]; }).sort(siraya);
    if (!kalan.length) return null;
    var simdiki = kelimeler.filter(function (k) { return k.id === simdikiId; })[0];
    if (!simdiki) return kalan[0];
    if (yon < 0) {
      var once = kalan.filter(function (k) { return k.sira < simdiki.sira; });
      return once.length ? once[once.length - 1] : kalan[kalan.length - 1];
    }
    var sonra = kalan.filter(function (k) { return k.sira > simdiki.sira; });
    return sonra.length ? sonra[0] : kalan[0];
  }

  function ilerleme(kelimeler, tikler) {
    return {
      ogrenilen: kelimeler.filter(function (k) { return tikler[k.id]; }).length,
      toplam: kelimeler.length
    };
  }

  // "**" ile ayrılan tek sıradaki parçalar kalındır; kapanmamış "**" sonrası düz kalır.
  function hikayeParcalari(metin) {
    var parca = String(metin).split("**");
    var acik = parca.length % 2 === 0;
    return parca.map(function (p, i) {
      return { metin: p, kalin: i % 2 === 1 && !(acik && i === parca.length - 1) };
    }).filter(function (p) { return p.metin !== ""; });
  }

  var Kuyruk = { siradaki: siradaki, ilerleme: ilerleme, hikayeParcalari: hikayeParcalari };
  if (typeof module !== "undefined" && module.exports) module.exports = Kuyruk;
  else kok.Kuyruk = Kuyruk;
})(this);
