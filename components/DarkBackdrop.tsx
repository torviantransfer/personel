/** Personel ekranlarının koyu zemini (tüm ekranı kaplar, içerik arkasında kalır). */
export default function DarkBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070b14]">
      <div className="absolute top-[34%] left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
      <div className="absolute top-1/3 -left-32 size-80 rounded-full bg-indigo-600/20 blur-[100px] [animation:drift_18s_ease-in-out_infinite]" />
      <div className="absolute -right-32 bottom-10 size-80 rounded-full bg-sky-500/15 blur-[100px] [animation:drift_22s_ease-in-out_infinite_reverse]" />
    </div>
  );
}
