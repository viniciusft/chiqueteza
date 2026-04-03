export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center text-white font-extrabold"
        style={{
          width: 32,
          height: 32,
          backgroundColor: 'var(--color-ever-green)',
          borderRadius: 10,
          fontSize: 16,
          fontFamily: 'var(--font-display)',
          flexShrink: 0,
        }}
      >
        C
      </div>
      <span
        style={{
          color: 'var(--color-ever-green)',
          fontSize: 19,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        Chiqueteza
      </span>
    </div>
  )
}
