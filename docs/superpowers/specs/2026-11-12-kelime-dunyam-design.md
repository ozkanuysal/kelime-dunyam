# Kelime Dünyam: tasarım

Tarih: 2026-11-12. Kart taslağı: https://claude.ai/artifact/8W6CjSmAMv9SY6boijzU6X

## Amaç ve neden

Kullanıcı İngilizceye temelden başlıyor. Günlük hayatta en sık karşılaşılan, resmi çizilebilen kelimeleri tek tek ezberlemek istiyor. Yöntem şu: her kelimenin kelimeyle ilgili bir resmi var ve o resme göre uydurulmuş kısa bir Türkçe hikâyesi var. Hikâye kelimenin anlamını akılda tutturuyor. Kullanıcı ilerledikçe öğrendiği kelimeleri tikliyor.

Site, kullanıcının mevcut `/gelisim` sitesinin kardeşi olacak. O da GitHub Pages'te duruyor, tikleri GitHub'a yazıyor ve ekleme işini bir skill yapıyor. Aynı düzen burada da kullanılacak.

## Hedefler

- GitHub Pages'te public bir site: **Kelime Dünyam**, `https://ozkanuysal.github.io/kelime-dunyam/`
- Site açılınca sıradaki öğrenilmemiş kelimenin kartı gelir.
- Kartın ön yüzünde yapay zekâ ile üretilmiş resim ve İngilizce kelime yazar.
- Karta dokununca kart 3B döner. Arka yüzde şunlar yazar:
  - Türkçe anlam
  - Resimdeki sahneye göre uydurulmuş Türkçe hikâye
  - İngilizce örnek cümle ve altında Türkçe çevirisi
- Kartın altında `← Önceki`, `Öğrendim ✓` ve `Sonraki →` düğmeleri var. Üstte kaçıncı kelimede olunduğu ve kaç kelimenin öğrenildiği ilerleme çubuğuyla görünür.
- Tiklenen kelime bir daha gelmez.
- 50 kelimenin hepsi tiklenince "Hepsi bitti, yeni parti iste" yazısı çıkar.
- Bir `/kelime` skill'i olur. Skill durumu söyler, yeni parti ekler ve kartları düzeltir.

## Kapsam dışı

- Sesli okunuş
- Tekrar ya da sınav modu
- Konu başlıkları ya da konuya göre filtre. Sıra tek ve karışık.
- Sitede tiki geri alma düğmesi. Yanlış tik atılırsa kullanıcı skill'e söyler.
- Gelişim sitesindeki küre gibi bir giriş ekranı

## Olmaması gerekenler (anti-hedefler)

- "the", "of", "a", "to" gibi işlev kelimeleri listeye girmez. Kullanıcı açıkça bunları istemedi.
- Resimle kelime alakasız olursa iş başarısız sayılır. Hikâye de resimde görünmeyen bir sahne anlatırsa başarısız sayılır. Resim ve hikâye aynı sahneyi anlatmalı.
- Resim ya da hikâyede özel bilgi, gerçek kişi adı ya da marka olmaz. Site herkese açık.
- Aynı kelime iki kez listeye girmez. Önceki partilerdeki kelimeler de buna dahil.

## Kullanıcının verdiği kararlar

| Konu | Karar |
|---|---|
| Ön yüz | Resim ve İngilizce kelime |
| Arka yüz | Türkçe anlam, hikâye, örnek cümle |
| Hikâye | Resme göre uydurulur. Resim kelimeyle ilgilidir. |
| Resim kaynağı | Yapay zekâ ile üretilir |
| Seviye | Temelden, sıfır başlangıç |
| Kelime türü | Nesneler, canlılar, eylemler, sıfatlar. Resmi çizilebilen temel kelimeler ("cat", "elephant", "run", "big"). |
| Sıra | Karışık, tek sıra |
| Parti | İlk parti 50 kelime. Sonrası skill'e "50 kelime daha ekle" denince eklenir. |
| Tiklenen kelime | Bir daha gelmez |
| Tema | Koyu (taslaktaki B: lacivert zemin, mavi vurgu, koyu kart) |

## Claude'un verdiği, kullanıcının onayladığı kararlar

- Açılışta doğrudan kart gelir, giriş ekranı yoktur.
- Ad `Kelime Dünyam`, repo `ozkanuysal/kelime-dunyam` (public), yerel klasör `~/projeler/kelime-dunyam`, skill `~/.claude/skills/kelime/`.
- Tikler `/gelisim`'deki gibi saklanır:
  - Sahip tikleri `tikler` dalındaki `tikler.json` dosyasına GitHub API ile yazılır.
  - Fine-grained token'ı kullanıcı siteye kendisi girer, token tarayıcıda durur.
  - Anahtarsız ziyaretçinin tikleri yalnızca kendi tarayıcısında (`localStorage`) durur.
- Resimler küçültülüp repoda saklanır. Site çalışırken resim servisine gitmez.
- Resim servisi ücretsiz olmalı, API anahtarı istememeli. Çalıştığı kullanmadan önce doğrulanır. Çalışan bir servis yoksa durulur ve kullanıcıya sorulur. Kullanıcı adına hesap ya da anahtar açılmaz.

## Claude'un kararları (builder kontrolünden sonra, onay bekliyor)

- **Ayrı anahtar ve depolama adları:** Gelişim sitesiyle aynı adreste (`ozkanuysal.github.io`) durduğu için tarayıcı depolaması ortaktır. Bu yüzden ayrı adlar kullanılır: `kelime-anahtar` ve `kelime-tikler-yerel`.
  - Kullanıcının mevcut token'ı yalnızca gelişim reposuna açık olabilir. Kurulumda kullanıcı ya `kelime-dunyam` reposunu o token'a ekler ya da yeni token açar. Token'a Contents okuma/yazma yetkisi verilir.
  - Token'ı telefona ve bilgisayara kendisi girer.
- **Filigranlı resim:** Logo ya da filigran basan bir servis "çalışmıyor" sayılır. Bu durumda durulur ve kullanıcıya sorulur.
- **Yarım kalan parti:** Kartlar üretildikçe yerelde commit edilir. Parti tamamlanmadan push yapılmaz. Böylece site hiçbir zaman yarım parti göstermez.
- **Tek sıra:** Bütün partiler tek bir sırada birleşir. Site, sırası en önde olan öğrenilmemiş kelimeyle açılır. İlerleme çubuğu bütün partileri birlikte sayar.

## Kart verisi

Her kelime şu bilgileri taşır. Alan adları ve dosya düzeni builder'a kalmıştır.

- kalıcı `id`: tikler buna bağlıdır, bir kez verilince değişmez
- İngilizce kelime
- tür: isim, eylem ya da sıfat
- Türkçe anlam: kelimenin birden çok yaygın anlamı varsa en çok 2–3 anlam
- hikâye: 2–4 cümle, Türkçe. Resimdeki sahneyi anlatır, kelimeyi geçirir ve Türkçe anlamını kalın yazar.
- örnek cümle: kısa, basit İngilizce bir cümle ve Türkçe çevirisi. Cümle tercihen resimdeki sahneden olur.
- resim dosyası
- parti numarası
- sıra

Taslaktaki örnek, beklenen tonu gösteriyor:

> **take**: almak, götürmek
> Hikâye: Ali pazarda tezgâhtaki en kırmızı elmaya uzanıyor. Satıcı gülümsüyor: "Take it!" Ali elmayı **alıp** cebine koyuyor ve eve **götürüyor**.
> Örnek: *Can I take this apple?* Bu elmayı alabilir miyim?

## Kelime seçimi

- Kaynak: kelimenin günlük hayatta sık geçmesi, başlangıç seviyesinde olması (A1–A2 civarı) ve tek bir sahneyle çizilebilmesi. Ölçüt sıklık listesindeki sıra değildir; "elephant" seviye olarak temeldir ve listeye girer.
- Her partide türler karışık olur. Ağırlık isimlerdedir, eylem ve sıfat da bulunur. Kelimeler karıştırılmış sırayla eklenir.
- Aynı kelimenin farklı biçimleri ayrı kart olmaz (`run` ve `running` gibi).

## Resim ve hikâye üretim akışı (kelime başına)

1. Claude kelimeyi anlatan tek bir sahne tarif eder (İngilizce prompt).
2. Resim servisi resmi üretir.
3. Claude resme bakar. Kelimeyle uyuşmuyorsa ya da bozuksa yeniden üretir.
4. Claude hikâyeyi resimde gerçekten görünen şeye göre yazar.
5. Resim web için küçültülür ve repoya konur.

Bütün resimlerde aynı çizim tarzı kullanılır. Tarzı builder seçer, koyu temaya ve kart oranına uygun olmalı.

## /kelime skill'i

`/gelisim` skill'inin düzenini izler: SKILL.md ve yardımcı bir betik, her çağrıda önce `git pull`.

| Kullanıcı ne der | Skill ne yapar |
|---|---|
| `/kelime` ya da "durum" | Öğrenilen ve kalan kelime sayısını, site bağlantısını kısa söyler. Yalnızca sahibin tikleri sayılır. |
| "50 kelime daha ekle" (ya da N) | Yeni kelimeleri seçer, yukarıdaki akışla kart üretir, ekler ve yayımlar |
| "şu kartın resmi/hikâyesi kötü" | O kartı yeniden üretir, `id` değişmez |
| "şu tiki geri al" | O kelimenin sahip tikini kaldırır |
| Görünüm değişikliği | `index.html` düzenlenir ve yayımlanır |

## Kısıtlar

- **Site herkese açıktır.** Repoya özel bilgi, e-posta ya da anahtar konmaz. Commit yazarı gelişim reposundaki gibi GitHub noreply adresidir.
- Kullanıcının GitHub token'ı asla istenmez, okunmaz ve yazılmaz.
- Commit iletilerine `Co-Authored-By` ya da Claude adı geçen satır eklenmez.
- Push'tan sonra site yaklaşık 1 dakikada güncellenir. Skill "yüklendi, 1 dakika içinde görünür" der.
- Çalışma ortamı WSL'dir. Windows programları WSL'den başlatılmaz.
- Site telefonda da düzgün çalışmalıdır. Kullanıcı tikleri hem telefondan hem bilgisayardan atar.
- Komutlara kısa timeout verilir. Uzun resim üretimi parçalara bölünür.

## Builder'a kalanlar

- Dosya düzeni ve veri alan adları
- Hangi ücretsiz resim servisinin kullanılacağı. Önce çalıştığı doğrulanır.
- Resim boyutu ve biçimi, çizim tarzı
- Yazı tipi ve koyu temanın ayrıntıları (taslaktaki B seçeneği esas alınır)
- "Önceki" ve "Sonraki" düğmelerinin yalnızca öğrenilmemiş kelimeler arasında gezmesi. Ardından tik atılınca bir sonraki kelimeye geçilmesi.
- Sahip tikini geri almanın skill tarafındaki yolu: `tikler` dalına commit ya da GitHub API
- İlk 50 kelimenin listesi
