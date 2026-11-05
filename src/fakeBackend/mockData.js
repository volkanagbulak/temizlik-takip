///Dummy Mock Data
// Demo bu veriyle açılıyor. Dokümanda makine ve formların önceden tanımlı olması,
// kişinin rastgele seçim yapamaması isteniyor.
export const mockData = {
  users: [
    { id: "user1", name: "Ahmet Yılmaz", role: "operator", active: true },
    { id: "user2", name: "Mehmet Demir", role: "operator", active: true },
    { id: "user3", name: "Zeynep Arslan", role: "admin", active: true },
    { id: "user4", name: "Hakan Kaya", role: "operator", active: true },
  ],
  facilities: [{ id: "facility1", code: "GEB", name: "Gebze Tesisi" }],
  lines: [
    {
      id: "line1",
      facilityId: "facility1",
      code: "H1",
      name: "Karıştırma Hattı",
    },
    {
      id: "line2",
      facilityId: "facility1",
      code: "H2",
      name: "Ayrıştırma Hattı",
    },
    { id: "line3", facilityId: "facility1", code: "H3", name: "Üretim Hattı" },
    {
      id: "line4",
      facilityId: "facility1",
      code: "H4",
      name: "Temizlik Hattı",
    },
  ],
  machines: [
    // H1: Karıştırma Hattı
    {
      id: "machine1",
      lineId: "line1",
      code: "KRS01",
      name: "Karıştırıcı 1",
      active: true,
    },
    {
      id: "machine2",
      lineId: "line1",
      code: "KRS02",
      name: "Karıştırıcı 2",
      active: true,
    },
    {
      id: "machine3",
      lineId: "line1",
      code: "KRS03",
      name: "Karıştırıcı 3 (eski)",
      active: false,
    },

    // H2: Ayrıştırma Hattı
    {
      id: "machine4",
      lineId: "line2",
      code: "AYR01",
      name: "Ayrıştırıcı 1",
      active: true,
    },
    {
      id: "machine5",
      lineId: "line2",
      code: "AYR02",
      name: "Ayrıştırıcı 2",
      active: true,
    },
    {
      id: "machine6",
      lineId: "line2",
      code: "SEP01",
      name: "Seperatör",
      active: true,
    },

    // H3: Üretim Hattı
    {
      id: "machine7",
      lineId: "line3",
      code: "DLM01",
      name: "Dolum Makinesi 1",
      active: true,
    },
    {
      id: "machine8",
      lineId: "line3",
      code: "DLM02",
      name: "Dolum Makinesi 2",
      active: true,
    },
    {
      id: "machine9",
      lineId: "line3",
      code: "KPK01",
      name: "Kapaklama Makinesi",
      active: true,
    },

    // H4: Temizlik Hattı
    {
      id: "machine10",
      lineId: "line4",
      code: "YKM01",
      name: "Yıkama Makinesi",
      active: true,
    },
    {
      id: "machine11",
      lineId: "line4",
      code: "KRT01",
      name: "Kurutma Makinesi",
      active: true,
    },
  ],
  // Malzemenin kodu, lotu ve son kullanma tarihi kayıtta geriye dönük görülebilmeli.
  materials: [
    {
      id: "material1",
      code: "TM-101",
      name: "Alkali Temizleyici",
      lots: [{ lot: "A25-0412", expiry: "2027-05-03" }],
    },
    {
      id: "material2",
      code: "TM-205",
      name: "Asidik Temizleyici",
      lots: [{ lot: "B26-0118", expiry: "2027-01-20" }],
    },
    {
      id: "material3",
      code: "TM-310",
      name: "Dezenfektan",
      lots: [
        { lot: "C26-0301", expiry: "2026-12-15" },
        { lot: "C26-0702", expiry: "2027-07-02" },
      ],
    },
  ],
  // machineIds hangi formun hangi makinede kullanılacağını belirliyor. Versiyonları ayrı
  // tutuyorum, çünkü tanım değişse de eski kayıtlar o günkü hâlini göstermeli.
  procedures: [
    {
      id: "procedure1",
      code: "TP-01",
      name: "Ürün Değişimi Temizliği",
      category: "normal", // acil olanı 'emergency'
      machineIds: ["machine1", "machine2", "machine7"],
      versions: [
        {
          version: 1,
          note: "İlk yayın",
          materialRequired: true,
          phases: [
            {
              id: "ph1",
              name: "Ön hazırlık",
              minMinutes: 15,
              steps: [
                {
                  id: "s1",
                  title: "Makineyi durdur",
                  description: "Hattı durdur, kilitle.",
                  media: null,
                },
                {
                  id: "s2",
                  title: "Enerjiyi kes",
                  description: "Şalteri kapat, etiketle.",
                  media: null,
                },
                {
                  id: "s3",
                  title: "Ürün kalıntısını boşalt",
                  description: "Tankı boşalt.",
                  media: null,
                },
                {
                  id: "s4",
                  title: "Koruyucu ekipmanı giy",
                  description: "Görseldeki ekipmanı kullan.",
                  media: "/egitim.jpg",
                },
                {
                  id: "s5",
                  title: "Parçaları sök",
                  description: "Sökülen parçaları tepsiye koy.",
                  media: null,
                },
              ],
            },
            {
              id: "ph2",
              name: "Yıkama",
              minMinutes: 20,
              steps: [
                {
                  id: "s6",
                  title: "Ön durulama",
                  description: "Suyla durula.",
                  media: null,
                },
                {
                  id: "s7",
                  title: "Kimyasalla yıkama",
                  description: "Seçilen malzemeyi kullan.",
                  media: null,
                },
                {
                  id: "s8",
                  title: "Son durulama",
                  description: "Temiz suyla durula.",
                  media: null,
                },
              ],
            },
            {
              id: "ph3",
              name: "Son kontrol",
              minMinutes: 10,
              steps: [
                {
                  id: "s9",
                  title: "Kurut",
                  description: "Basınçlı havayla kurut.",
                  media: null,
                },
                {
                  id: "s10",
                  title: "Parçaları tak",
                  description: "Parçaları yerine tak.",
                  media: null,
                },
                {
                  id: "s11",
                  title: "Görsel kontrol",
                  description: "Kalıntı olmadığını kontrol et.",
                  media: null,
                },
                {
                  id: "s12",
                  title: "Makineyi hazırla",
                  description: "Kilidi kaldır.",
                  media: null,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "procedure2",
      code: "TP-02",
      name: "Periyodik Temizlik",
      category: "normal",
      machineIds: ["machine4", "machine5", "machine6", "machine8", "machine9"],
      versions: [
        {
          version: 1,
          note: "İlk yayın",
          materialRequired: false,
          phases: [
            {
              id: "ph1",
              name: "Temizlik",
              minMinutes: 10,
              steps: [
                {
                  id: "s1",
                  title: "Makineyi durdur",
                  description: "Hattı durdur.",
                  media: null,
                },
                {
                  id: "s2",
                  title: "Yüzeyleri sil",
                  description: "Dış yüzeyleri sil.",
                  media: null,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      // Acil müdahaleler ayrı bir tür: saha defterine işlenmiyor, saha referansı almıyor.
      id: "procedure3",
      code: "AC-01",
      name: "Acil Müdahale Temizliği",
      category: "emergency",
      machineIds: ["machine1", "machine2", "machine4", "machine5", "machine7", "machine8"],
      versions: [
        {
          version: 1,
          note: "İlk yayın",
          materialRequired: false,
          phases: [
            {
              id: "ph1",
              name: "Müdahale",
              minMinutes: 5,
              steps: [
                {
                  id: "s1",
                  title: "Alanı güvene al",
                  description: "Hattı durdur.",
                  media: null,
                },
                {
                  id: "s2",
                  title: "Dökülmeyi temizle",
                  description: "Bölgeyi temizle.",
                  media: null,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  records: [],
  auditLog: [],
};
