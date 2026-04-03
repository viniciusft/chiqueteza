export function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #E8F0EF 25%, #D4E6E4 50%, #E8F0EF 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 16,
        height,
        marginBottom: 8,
      }}
    />
  )
}

export function SkeletonList({ count = 3, height = 80 }: { count?: number; height?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </>
  )
}
