import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchIcon, Loader2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/pages/api/search.json';

interface SearchInputProps {
  placeholder: string;
  lang: 'fr' | 'nl' | 'en';
  className?: string;
  autoFocus?: boolean;
}

const translations = {
  fr: { noResults: 'Aucune entreprise trouvée' },
  nl: { noResults: 'Geen bedrijven gevonden' },
  en: { noResults: 'No companies found' },
} as const;

export function SearchInput({ placeholder, lang, className, autoFocus }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search function with debouncing handled by useEffect
  const search = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchQuery.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/search.json?q=${encodeURIComponent(searchQuery)}&lang=${lang}`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
        setHighlightedIndex(-1);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Search error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  // Debounced search effect (150ms for snappy feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    window.location.href = `/${lang}/${result.vat_number}/${result.slug}`;
  }, [lang]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.length >= 3) {
        // Trigger search on Enter if dropdown is closed
        search(query);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, results, highlightedIndex, handleSelect, query, search]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 3 && results.length > 0 && setIsOpen(true)}
          autoFocus={autoFocus}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2Icon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 && query.length >= 3 && !isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              {translations[lang].noResults}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((result, index) => (
                <li
                  key={result.vat_number}
                  className={cn(
                    'px-4 py-2 cursor-pointer hover:bg-accent',
                    index === highlightedIndex && 'bg-accent'
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(result)}
                >
                  <div className="font-medium text-sm truncate">
                    {result.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {result.city && <span>{result.city}</span>}
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {lang === 'fr' ? 'Active' : lang === 'nl' ? 'Actief' : 'Active'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
