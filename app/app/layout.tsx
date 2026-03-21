import TabBar from '@/components/ui/TabBar'
import { Toaster } from 'sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: 80 }}>
        {children}
      </div>
      <TabBar />
      <Toaster position="top-center" richColors />
    </>
  )
}
