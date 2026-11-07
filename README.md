# Temizlik Takip

Üretim makinelerinin temizlik sürecini kâğıt formdan çıkarıp adım adım dijital olarak takip eden bir demo. Operatör kaydı açar, tanımlı fazları ve adımları sırayla yürütür; başlangıç ve bitiş zamanlarını sistem yazar, süre ile insan eforu ayrı hesaplanır. Yönetici tanımları yönetir, takılan kayıtlara müdahale eder ve raporları görür.

**Canlı demo:** _(Vercel linki buraya)_

## Çalıştırma

```bash
npm install
npm run dev
```

Vite'ın verdiği adresi aç (genelde `http://localhost:5173`). Backend yok; veri tarayıcıda tutuluyor.

## Demo kullanıcıları

| Kullanıcı | Rol |
| --- | --- |
| Ahmet Yılmaz, Mehmet Demir, Hakan Kaya | Operatör |
| Zeynep Arslan | Yönetici |

Şifre yok, giriş ekranında kullanıcı seçiliyor. Her sekme ayrı kullanıcıyla açılabiliyor. İlk açılışta son 9 güne yayılmış 12 örnek kayıt üretiliyor; giriş ekranındaki **Örnek veriye dön** ile her şey başa alınabiliyor.

**Önerilen deneme sırası:**

1. Ahmet ile yeni kayıt aç (malzeme zorunlu formda lot seçmeden göndermeyi dene).
2. İkinci sekmede Mehmet ile aynı makineyi seç: makine "Ahmet Yılmaz kullanıyor" diye pasif görünür; yine de gönderilirse servis reddeder.
3. Ahmet adımları yürütsün; duraklat, ikinci kişi ekle, devam et. Süre ile efor ayrı ilerler, mola süreye sayılmaz.
4. Fazın minimum süresi dolmadan fazı bitir: açıklama istenir, sapma kaydedilir.
5. Mehmet, Ahmet'in kaydını görebilir ama görevli olmadığı adımı ilerletemez.
6. Zeynep ile prosedürde minimum süreyi değiştir: yeni versiyon oluşur, eski kayıtlar eski versiyonda kalır.
7. Kayıt detayında denetim izine, Raporlar'da makine ve faz bazında sürelere bak.

## Mimari

```
Sayfa → api/ (recordApi, stepApi, machineApi, …) → Axios → fakeBackend/fakeServer.js → cleaningService.js → fakeDb.js (localStorage)
```

- **Sayfalar kural hesaplamıyor.** Veriyi okuyor, gösteriyor ve kullanıcı işlemini servise iletiyor. Butonlar servisten gelen `permissions` bilgisine göre görünüyor.
- **İş kuralları tek yerde** (`fakeBackend/cleaningService.js`). Vaka "sadece ekranda kontrol etmek yeterli olmayabilir" diyor; ekran eski veriyle istek atsa bile kararı servis güncel veriyle veriyor ve 403 / 409 / 422 ile reddediyor.
- **Sahte sunucu** (`fakeServer.js`) Axios isteğini ağa çıkarmadan yakalıyor: rotayı buluyor, kullanıcıyı doğruluyor, veriyi okuyor, kuralı çalıştırıyor, sadece yazma isteğinde kaydediyor. Kural hata verirse hiçbir şey kaydedilmiyor.
- **Gerçek backend'e geçiş:** `fakeBackend/` klasörü silinir, Axios'ta adapter yerine `baseURL` verilir, `x-user-id` başlığı yerine token gelir. Sayfalar ve `api/` dosyaları değişmez.
- **Sekmeler arası güncelleme:** Başka sekme veriyi değiştirince tarayıcının `storage` olayıyla sayfalar kendini yeniliyor.

```
src/
  api/          Sunucuyla konuşan katman (alanlara göre)
  components/   Ortak bileşenler (yerleşim, menü, kapatma penceresi)
  fakeBackend/  Gerçek backend gelince silinecek kısım: kurallar, sahte sunucu, veri, örnek kayıtlar
  hooks/        useAction: yazma işlemlerinin ortak kalıbı
  pages/        Ekranlar
  utils/        Süre ve efor hesapları (servis ve ekran aynı fonksiyonu kullanıyor)
```

## Teknoloji

React 19, Vite, React Router, Axios, Ant Design. JavaScript (TypeScript yok).
