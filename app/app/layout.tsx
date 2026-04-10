import TabBar from '@/components/ui/TabBar'
import { ToasterProvider } from '@/components/ui/ToasterProvider'
import { NotificationPermission } from '@/components/ui/NotificationPermission'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: 80 }}>
        {children}
      </div>
      <TabBar />
      <ToasterProvider />
      <NotificationPermission />
    </>
  )
}
