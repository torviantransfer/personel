/**
 * iOS'ta durum çubuğu şeffaf ve yazıları beyazdır (black-translucent).
 * Açık renkli yönetici sayfalarında saat/pil simgeleri görünsün diye çentik alanına koyu şerit çizer.
 * Android ve tarayıcıda safe-area-inset-top 0 olduğundan görünmez.
 */
export default function StatusBarScrim() {
  return <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[env(safe-area-inset-top)] bg-ink print:hidden" />;
}
