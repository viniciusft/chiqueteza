export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center text-white font-extrabold text-base"
        style={{
          width: 32,
          height: 32,
          backgroundColor: '#1B5E5A',
          borderRadius: 10,
          fontSize: 16,
        }}
      >
        C
      </div>
      <span
        className="font-extrabold tracking-tight"
        style={{ color: '#1B5E5A', fontSize: 18 }}
      >
        Chiqueteza
      </span>
    </div>
  )
}
