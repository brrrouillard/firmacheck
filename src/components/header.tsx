import { SearchInput } from "@/components/search/search-input"

interface HeaderProps {
  searchPlaceholder?: string;
  lang?: 'fr' | 'nl' | 'en';
}

export function Header({ searchPlaceholder = "Search companies...", lang = 'fr' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl flex h-14 items-center px-6 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">firmacheck</span>
        </a>
        <div className="flex-1 flex justify-center px-4">
          <SearchInput
            placeholder={searchPlaceholder}
            lang={lang}
            className="w-full max-w-md"
          />
        </div>
        <div className="w-[100px]" />
      </div>
    </header>
  )
}
