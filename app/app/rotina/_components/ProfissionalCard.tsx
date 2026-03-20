'use client'

import Link from 'next/link'

interface Profissional {
  id: string
  nome: string
  especialidades: string[] | null
  avaliacao: number | null
  valor_medio: number | null
  telefone: string | null
  instagram: string | null
}

function Estrelas({ avaliacao }: { avaliacao: number | null }) {
  const total = avaliacao ?? 0
  return (
    <span style={{ fontSize: 14, color: '#D4A843' }}>
      {'★'.repeat(total)}
      <span style={{ color: '#E8E8E8' }}>{'★'.repeat(5 - total)}</span>
    </span>
  )
}

export default function ProfissionalCard({ profissional }: { profissional: Profissional }) {
  return (
    <Link href={`/app/rotina/profissionais/${profissional.id}`} className="block">
      <div
        className="flex flex-col gap-2 px-4 py-4 bg-white"
        style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-extrabold text-gray-800" style={{ fontSize: 15 }}>
              {profissional.nome}
            </p>
            {profissional.avaliacao && <Estrelas avaliacao={profissional.avaliacao} />}
            {profissional.valor_medio && (
              <p className="text-gray-500" style={{ fontSize: 12 }}>
                Valor médio:{' '}
                {Number(profissional.valor_medio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {profissional.telefone && (
              <a
                href={`tel:${profissional.telefone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#F5F5F5',
                  fontSize: 18,
                }}
              >
                📞
              </a>
            )}
            {profissional.instagram && (
              <a
                href={`https://instagram.com/${profissional.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#F5F5F5',
                  fontSize: 18,
                }}
              >
                📸
              </a>
            )}
          </div>
        </div>
        {(profissional.especialidades ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(profissional.especialidades ?? []).map((esp) => (
              <span
                key={esp}
                className="font-bold uppercase tracking-wide"
                style={{
                  fontSize: 10,
                  backgroundColor: '#F5F5F5',
                  color: '#1B5E5A',
                  borderRadius: 6,
                  padding: '2px 8px',
                }}
              >
                {esp}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
