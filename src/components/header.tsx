import { Input } from "@/components/ui/input"

interface HeaderProps {
  searchPlaceholder?: string;
}

export function Header({ searchPlaceholder = "Search companies..." }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">firmascan</span>
        </a>
        <div className="flex-1 flex justify-center px-4">
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full max-w-md"
            disabled
          />
        </div>
        <div className="w-[100px]" />
      </div>
    </header>
  )
}
