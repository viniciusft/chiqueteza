import { SkeletonCard } from '@/components/ui/SkeletonCard'
import PageContainer from '@/components/ui/PageContainer'

export default function VisagismoLoading() {
  return (
    <PageContainer>
      <div style={{ height: 56, backgroundColor: '#fff', borderBottom: '1px solid #E8E8E8' }} />
      <main className="flex flex-col px-5 py-6 gap-5">
        <div style={{ height: 32, width: 140, borderRadius: 8, background: '#e0e0e0' }} />
        <SkeletonCard height={140} />
        <SkeletonCard height={52} />
        <SkeletonCard height={52} />
      </main>
    </PageContainer>
  )
}
