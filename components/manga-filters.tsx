"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEMOGRAPHICS,
  STATUSES,
  ORDER_OPTIONS,
  POPULAR_TAGS,
  type SearchFilters,
} from "@/lib/mangadex";

interface MangaFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function MangaFilters({ filters, onFiltersChange }: MangaFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.demographic || filters.status || filters.orderBy || (filters.tags && filters.tags.length > 0);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof SearchFilters, value: string | string[] | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tagId: string) => {
    const currentTags = filters.tags || [];
    if (currentTags.includes(tagId)) {
      updateFilter(
        "tags",
        currentTags.filter((t) => t !== tagId)
      );
    } else {
      updateFilter("tags", [...currentTags, tagId]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2 text-destructive hover:text-destructive">
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {/* Ordenar por */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Ordenar por</h3>
            <div className="flex flex-wrap gap-2">
              {ORDER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.orderBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateFilter("orderBy", filters.orderBy === option.value ? undefined : option.value)
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Demografia */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Demografia</h3>
            <div className="flex flex-wrap gap-2">
              {DEMOGRAPHICS.map((demo) => (
                <Button
                  key={demo.value}
                  variant={filters.demographic === demo.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateFilter("demographic", filters.demographic === demo.value ? undefined : demo.value)
                  }
                >
                  {demo.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Estado</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <Button
                  key={status.value}
                  variant={filters.status === status.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateFilter("status", filters.status === status.value ? undefined : status.value)
                  }
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Generos/Tags */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Generos</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Button
                  key={tag.id}
                  variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filters chips */}
      {hasActiveFilters && !isExpanded && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.orderBy && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {ORDER_OPTIONS.find((o) => o.value === filters.orderBy)?.label}
              <button onClick={() => updateFilter("orderBy", undefined)} className="hover:text-primary/70">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.demographic && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm">
              {DEMOGRAPHICS.find((d) => d.value === filters.demographic)?.label}
              <button onClick={() => updateFilter("demographic", undefined)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm">
              {STATUSES.find((s) => s.value === filters.status)?.label}
              <button onClick={() => updateFilter("status", undefined)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.tags?.map((tagId) => {
            const tag = POPULAR_TAGS.find((t) => t.id === tagId);
            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
              >
                {tag?.name}
                <button onClick={() => toggleTag(tagId)} className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
