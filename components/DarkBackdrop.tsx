/**
 * Personel ekranlarının koyu zemini.
 * - Işımalar blur filtresi yerine radial-gradient ile çizilir: iOS Safari'de kademelenme/koyu halka oluşmaz, daha hafiftir.
 * - Ekranın dışına taşar: iPhone'da ev çubuğu ve çentik bölgesinde düz koyu şerit kalmaz.
 */
export default function DarkBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 -top-24 -bottom-40 -z-10 overflow-hidden bg-[#070b14]">
      <div className="absolute top-[34%] left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(22_119_255/0.30),rgb(22_119_255/0.10)_55%,transparent)]" />
      <div className="absolute top-[28%] -left-56 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(79_70_229/0.20),transparent)] [animation:drift_18s_ease-in-out_infinite]" />
      <div className="absolute -right-56 bottom-[12%] size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(14_165_233/0.14),transparent)] [animation:drift_22s_ease-in-out_infinite_reverse]" />
      {/* Yalnızca iOS: üst kenar opak siyah durum çubuğuyla birleşsin */}
      <div className="ios-top-blend absolute inset-x-0 top-24 h-24 bg-gradient-to-b from-black to-transparent" />
    </div>
  );
}
