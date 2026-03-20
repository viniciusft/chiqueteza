import Link from 'next/link'

const colorMap = {
  green: '#1B5E5A',
  pink: '#F472A0',
  blue: '#A8C5CC',
  gold: '#D4A843',
}

interface FeatureCardProps {
  title: string
  subtitle: string
  icon: string
  color: 'green' | 'pink' | 'blue' | 'gold'
  href: string
  badge?: string
}

export default function FeatureCard({ title, subtitle, icon, color, href, badge }: FeatureCardProps) {
  return (
    <Link href={href} className="block w-full">
      <div
        className="flex flex-col gap-1 active:scale-[0.98] transition-transform"
        style={{
          backgroundColor: colorMap[color],
          borderRadius: 20,
          padding: 18,
        }}
      >
        {badge && (
          <span
            className="font-bold uppercase tracking-widest"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}
          >
            {badge}
          </span>
        )}
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span
          className="font-extrabold tracking-tight"
          style={{ fontSize: 15, color: '#fff' }}
        >
          {title}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
          {subtitle}
        </span>
      </div>
    </Link>
  )
}
