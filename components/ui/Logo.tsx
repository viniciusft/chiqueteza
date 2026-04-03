export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center text-white font-extrabold rounded-xl flex-shrink-0"
        style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #FF3366, #C41A4A)',
          fontSize: 16,
          fontFamily: 'var(--font-display)',
        }}
      >
        C
      </div>
      <span
        style={{
          color: 'var(--color-primary)',
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
