"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, Star, Users, BookOpen, Tv, Calendar } from "lucide-react";
import type { ANNDetail } from "@/lib/ann";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ANNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "title";

  const { data, isLoading, error } = useSWR<ANNDetail>(
    `/api/ann/details?id=${id}&type=${type}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 text-center">
          <p className="text-muted-foreground mb-4">No se pudo cargar la información</p>
          <Button asChild variant="outline">
            <Link href="/news"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

  const score = data.bayesian_score ? parseFloat(data.bayesian_score).toFixed(2) : null;
  const votes = data.nb_votes ? parseInt(data.nb_votes).toLocaleString("es-AR") : null;

  // Get specific info fields
  const getInfo = (type: string) => data.info.filter(i => i.type === type).map(i => i.value);
  const studios = getInfo("Animation Production").concat(getInfo("Production"));
  const directors = data.staff.filter(s => s.task.toLowerCase().includes("director")).slice(0, 3);
  const writers = data.staff.filter(s => s.task.toLowerCase().includes("script") || s.task.toLowerCase().includes("original work")).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/news" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Enciclopedia ANN
          </Link>
        </Button>

        {/* Main info */}
        <div className="grid md:grid-cols-[220px_1fr] gap-8 mb-8">
          {/* Cover */}
          <div>
            {data.coverUrl ? (
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-muted">
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(data.coverUrl)}`}
                  alt={data.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-xl bg-muted flex items-center justify-center">
                {data.type === "anime" ? (
                  <Tv className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            )}

            {/* Score */}
            {score && (
              <div className="mt-4 p-3 rounded-lg bg-muted text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">{score}</span>
                  <span className="text-muted-foreground text-sm">/10</span>
                </div>
                {votes && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {votes} votos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="secondary" className="shrink-0 mt-1">
                {data.type === "anime" ? "🎬 Anime" : "📖 Manga"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{data.name}</h1>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              {data.startDate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> {data.startDate}
                </div>
              )}
              {data.episodes && (
                <Badge variant="outline">{data.episodes} episodios</Badge>
              )}
              {data.volumes && (
                <Badge variant="outline">{data.volumes} volúmenes</Badge>
              )}
            </div>

            {/* Genres & Themes */}
            {data.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {data.genres.map(g => (
                  <Badge key={g} className="bg-primary/10 text-primary border-0 text-xs">{g}</Badge>
                ))}
              </div>
            )}
            {data.themes.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {data.themes.map(t => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}

            {/* Plot */}
            {data.plot && (
              <p className="text-muted-foreground leading-relaxed mb-4 text-sm">{data.plot}</p>
            )}

            {/* Quick staff */}
            {directors.length > 0 && (
              <p className="text-sm text-muted-foreground mb-1">
                <span className="text-foreground font-medium">Director:</span>{" "}
                {directors.map(d => d.person).join(", ")}
              </p>
            )}
            {studios.length > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                <span className="text-foreground font-medium">Estudio:</span>{" "}
                {studios.slice(0, 2).join(", ")}
              </p>
            )}

            {/* ANN link - required by ToS */}
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Ver ficha completa en Anime News Network
            </a>
          </div>
        </div>

        {/* Staff */}
        {data.staff.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.staff.slice(0, 16).map((s, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{s.task}</span>
                    <span className="font-medium text-foreground">{s.person}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cast */}
        {data.cast.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Reparto de voces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.cast.slice(0, 16).map((c, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{c.role}</span>
                    <span className="font-medium text-foreground">
                      {c.person}
                      {c.language && <span className="text-xs text-muted-foreground ml-1">({c.language})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related */}
        {data.related.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">Títulos relacionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {data.related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/ann/${r.id}?type=${r.type}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <span className="text-foreground">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{r.rel}</Badge>
                      <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ANN attribution footer - required by ToS */}
        <div className="text-xs text-muted-foreground text-center border-t pt-6">
          Datos provistos por{" "}
          <a href="https://www.animenewsnetwork.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Anime News Network
          </a>
          .{" "}
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Ver ficha completa en la Enciclopedia ANN
          </a>.
        </div>
      </main>
    </div>
  );
}
