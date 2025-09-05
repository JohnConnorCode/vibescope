// src/app/vibes/[id]/page.tsx
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from('share_cards')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) {
    return { title: 'VibeScope' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ogImageUrl = `${appUrl}${data.og_image_url}`

  return {
    title: `${data.term} - VibeScope`,
    description: data.nano_summary || `Explore the vibe of "${data.term}"`,
    openGraph: {
      title: `${data.term} - VibeScope`,
      description: data.nano_summary || `Explore the vibe of "${data.term}"`,
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.term} - VibeScope`,
      description: data.nano_summary || `Explore the vibe of "${data.term}"`,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from('share_cards')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) {
    return (
      <div className="min-h-dvh bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vibe not found</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Create your own vibe →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl p-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {data.term}
          </h1>
          {data.nano_summary && (
            <p className="text-xl text-neutral-300 italic">"{data.nano_summary}"</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-neutral-800 p-6">
            <h2 className="font-semibold mb-4 text-lg">Vibe Profile</h2>
            <div className="space-y-3">
              {Object.entries(data.axes_json).map(([axis, score]: [string, any]) => (
                <div key={axis} className="flex justify-between items-center">
                  <span className="text-neutral-400">{axis}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={score > 0 ? 'bg-green-500' : 'bg-red-500'}
                        style={{ 
                          width: `${Math.abs(score) * 50}%`,
                          marginLeft: score < 0 ? `${50 - Math.abs(score) * 50}%` : '50%'
                        }}
                        />
                    </div>
                    <span className={`text-sm font-mono ${score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(score * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 p-6">
            <h2 className="font-semibold mb-4 text-lg">Similar Vibes</h2>
            <div className="flex flex-wrap gap-2">
              {data.neighbors_json.slice(0, 12).map((n: any) => (
                <span 
                  key={n.term}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 text-sm"
                >
                  {n.term}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href={`/?term=${encodeURIComponent(data.term)}`}
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium"
          >
            Explore this vibe interactively →
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-500">
          <p>Created with <Link href="/" className="text-purple-400 hover:text-purple-300">VibeScope</Link></p>
        </div>
      </div>
    </div>
  )
}