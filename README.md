WorkFlow360 – Kurumsal İzin & Gider Yönetim Uygulaması

Proje Tanımı
WorkFlow360, kurumsal firmalar için geliştirilmiş, multi-tenant (çoklu firma) yapısına sahip bir mobil SaaS uygulamasıdır.

Amaç:
İdari izin süreçlerini dijitalleştirmek
Fiş / fatura yükleme ve onay mekanizması sağlamak
Rol bazlı yetkilendirme ile kontrollü erişim sunmak
Abonelik modeli ile birden fazla firmanın aynı sistemi kullanmasını sağlamak

Uygulama:
iOS & Android (tek kod tabanı)
Açık & Koyu tema destekli
Responsive (telefon + tablet)
SaaS abonelik modeli

Ürün Amacı
Kurumsal firmalarda şu problemler yaygındır:
İzinler Excel veya WhatsApp ile takip edilir
Fiş/fatura süreçleri düzensizdir
Muhasebe ve saha personeli arasında veri kopukluğu vardır
Yönetici raporlama yapmakta zorlanır
WorkFlow360 bu süreçleri tek mobil uygulamada birleştirir.

Sistem Mimarisi
1️⃣ Multi-Tenant Yapı
Sistem çoklu firma yapısına sahiptir.
Her veri şu yapıya bağlıdır: CompanyID → tüm ana tablolarda foreign key

Her firma:
Kendi kullanıcılarını oluşturur
Kendi izinlerini görür
Kendi fiş/faturalarını görür
Diğer firmalardan tamamen izoledir
Tek backend, tek veritabanı; veri izolasyonu CompanyID ile sağlanır.7

Kullanıcı Rolleri
Personel
Yetkiler:
İzin talebi oluşturma
Fiş / fatura yükleme
Sadece kendi izinlerini görme
Sadece kendi yüklediği fişleri görme

Kısıtlar:
Başkalarının verisini göremez
Onaylama yapamaz

İdari
Yetkiler:
Tüm fiş / faturaları görme
Fiş onaylama / reddetme
Raporlama
Kendi izin talebini oluşturma

Muhasebe
Yetkiler:
Tüm fiş / faturaları görme
Fiş onaylama / reddetme
Raporlama
Kendi izin talebini oluşturma

Authentication & Firma Yönetimi
Özellikler
Firma oluşturma
Firma yöneticisi oluşturma
Kullanıcı davet sistemi
Rol atama
Login / Logout
JWT tabanlı authentication
Şifre sıfırlama

İzin Modülü
Özellikler
İzin talebi oluşturma
İzin türü seçme:
Yıllık izin
Hastalık izni
Ücretsiz izin
Başlangıç / bitiş tarihi
Açıklama alanı
Durum:
Pending
Approved
Rejected

İş Akışı
Personel izin talebi oluşturur
Durum: Pending
İdari rolü:
Onaylar → Approved
Reddeder → Rejected
Personel sonucu görür

Fiş / Fatura Modülü
Özellikler
Kamera ile fotoğraf çekme
Galeriden yükleme
Tutar girişi
Tarih girişi
Açıklama alanı
Durum:
Pending
Approved
Rejected

İş Akışı
Personel fiş yükler
Durum: Pending
Muhasebe:
Onaylar
Reddvergile
Personel sonucu görür

Dashboard
Personel Dashboard
Aktif izin durumu
Bekleyen izin
Son yüklenen fişler

İdari Dashboard
Bekleyen izin sayısı
Toplam personel sayısı
Son yüklenen fişler

Muhasebe Dashboard
Bekleyen fiş sayısı
Aylık toplam gider
Onaylanan / reddedilen oranı

💳 Abonelik Sistemi
| Plan       | Kullanıcı Limiti | Özellik          |
| ---------- | ---------------- | ---------------- |
| Free       | 5 kullanıcı      | Temel özellikler |
| Pro        | 50 kullanıcı     | Tüm özellikler   |
| Enterprise | Sınırsız         | Özel destek      |

Kontroller
Kullanıcı limiti backend’de kontrol edilir

Plan süresi dolarsa:
Yeni kullanıcı eklenemez
Yeni işlem kısıtlanabilir