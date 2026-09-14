export function TestWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden select-none print:hidden"
    >
      <p className="font-display rotate-[-22deg] text-center text-6xl leading-none font-semibold tracking-wide text-primary/20 italic sm:text-8xl md:text-9xl">
        SITE EM TESTE
      </p>
    </div>
  );
}
