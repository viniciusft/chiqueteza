import TabBar from '@/components/ui/TabBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: 80 }}>
        {children}
      </div>
      <TabBar />
    </>
  )
}
