// src/app/vibes/[id]/page.tsx
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
      <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20 text-foreground flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">Vibe not found</h1>
            <Button asChild>
              <Link href="/">
                Create your own vibe →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20 text-foreground">
      <div className="mx-auto max-w-4xl p-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            {data.term}
          </h1>
          {data.nano_summary && (
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-50/10 to-pink-50/10 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
              <CardContent className="pt-6">
                <p className="text-xl text-muted-foreground italic">"{data.nano_summary}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Vibe Profile</CardTitle>
              <CardDescription>Multi-dimensional analysis scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.axes_json).map(([axis, score]: [string, any]) => (
                  <div key={axis} className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium capitalize">{axis}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${score > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ 
                            width: `${Math.abs(score) * 50}%`,
                            marginLeft: score < 0 ? `${50 - Math.abs(score) * 50}%` : '50%'
                          }}
                        />
                      </div>
                      <Badge variant={score > 0 ? 'default' : 'destructive'} className="min-w-[3rem] justify-center font-mono">
                        {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Similar Vibes</CardTitle>
              <CardDescription>Words with related semantic patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.neighbors_json.slice(0, 12).map((n: any) => (
                  <Badge
                    key={n.term}
                    variant="outline"
                    className="text-sm py-1.5 px-3"
                  >
                    {n.term}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <Button size="lg" asChild>
            <Link href={`/?term=${encodeURIComponent(data.term)}`}>
              Explore this vibe interactively →
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t text-center">
          <p className="text-muted-foreground">
            Created with <Button variant="link" asChild className="p-0 h-auto text-primary"><Link href="/">VibeScope</Link></Button>
          </p>
        </div>
      </div>
    </div>
  )
}