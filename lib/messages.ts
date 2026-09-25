import type { CameraErrorCode, ScanErrorCode } from "@/types";

export type Message = { title: string; description: string };

export const ERROR_MESSAGES: Record<ScanErrorCode | CameraErrorCode, Message> = {
  INVALID_QR: { title: "Geçersiz QR", description: "Bu QR kod tanımlı bir giriş noktasına ait değil." },
  WORKPLACE_INACTIVE: { title: "Bu giriş noktası aktif değil", description: "Lütfen yöneticinizle iletişime geçin." },
  ALREADY_CHECKED_IN: { title: "Zaten giriş yapılmış", description: "Girişiniz az önce kaydedildi. Tekrar okutmanıza gerek yok." },
  ALREADY_CHECKED_OUT: { title: "Zaten çıkış yapılmış", description: "Çıkışınız az önce kaydedildi. Tekrar okutmanıza gerek yok." },
  WRONG_WORKPLACE: { title: "Bu QR size ait değil", description: "Bu QR kod başka bir işletmeye ait. Yalnızca kendi işletmenizin QR kodunu okutabilirsiniz." },
  NO_WORKPLACE: { title: "İşletmeniz tanımlı değil", description: "Hesabınıza henüz bir işletme atanmamış. Yöneticinizle iletişime geçin." },
  ACCOUNT_INACTIVE: { title: "Hesabınız aktif değil", description: "Giriş/çıkış yapabilmek için yöneticinizle iletişime geçin." },
  PROFILE_NOT_FOUND: { title: "Profil bulunamadı", description: "Personel kaydınız oluşturulmamış. Yöneticinizle iletişime geçin." },
  UNAUTHORIZED: { title: "Oturum sona erdi", description: "Lütfen tekrar giriş yapın." },
  SERVER_ERROR: { title: "Bir sorun oluştu", description: "İşlem tamamlanamadı. Lütfen tekrar deneyin." },
  NETWORK_ERROR: { title: "Bağlantı yok", description: "İnternet bağlantınızı kontrol edip tekrar deneyin." },
  CAMERA_DENIED: {
    title: "Kamera izni verilmedi",
    description:
      "iPhone: Ayarlar › Safari › Kamera › \"Sor\" veya \"İzin Ver\" seçin, ardından uygulamayı yeniden açın.\nAndroid: Adres çubuğundaki/uygulama bilgisindeki izinlerden Kamera'yı açın.",
  },
  CAMERA_NOT_FOUND: { title: "Kamera bulunamadı", description: "Bu cihazda kullanılabilir bir kamera yok." },
  CAMERA_IN_USE: { title: "Kamera kullanımda", description: "Kamerayı kullanan diğer uygulamaları kapatıp tekrar deneyin." },
  CAMERA_INSECURE: { title: "Güvenli bağlantı gerekli", description: "Kamera yalnızca HTTPS üzerinden çalışır." },
  CAMERA_UNSUPPORTED: { title: "Kamera desteklenmiyor", description: "Tarayıcınızı güncelleyin veya Safari/Chrome kullanın." },
};
