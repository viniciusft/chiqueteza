import AppHeader from '@/components/ui/AppHeader'
import PageContainer from '@/components/ui/PageContainer'

export default function ArmarioLoading() {
  return (
    <>
      <AppHeader />
      <PageContainer>
        <div style={{ padding: '16px 20px 0', marginBottom: 16 }}>
          <div className="skeleton-shimmer" style={{ height: 32, width: 160, borderRadius: 8 }} />
          <div className="skeleton-shimmer" style={{ height: 16, width: 200, borderRadius: 6, marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="skeleton-shimmer" style={{ height: 46, borderRadius: 14 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />
          ))}
        </div>
      </PageContainer>
    </>
  )
}
