import { SkeletonList } from '@/components/ui/SkeletonCard'
import PageContainer from '@/components/ui/PageContainer'

export default function ProfissionaisLoading() {
  return (
    <PageContainer>
      <div style={{ height: 56, backgroundColor: '#fff', borderBottom: '1px solid #E8E8E8' }} />
      <main className="flex flex-col gap-4 px-5 py-6">
        <div style={{ height: 32, width: 160, borderRadius: 8, background: '#e0e0e0' }} />
        <SkeletonList count={4} height={80} />
      </main>
    </PageContainer>
  )
}
