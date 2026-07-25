'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { FilterOption, SortOption } from '@/hooks/use-admin-table-filters';

type AdminTableFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
  filterBy?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  resultCount?: number;
  totalCount?: number;
  onReset?: () => void;
  className?: string;
};

export function AdminTableFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  sortBy,
  onSortChange,
  sortOptions,
  filterBy,
  onFilterChange,
  filterOptions,
  filterLabel = 'Filtrer',
  resultCount,
  totalCount,
  onReset,
  className = '',
}: AdminTableFiltersProps) {
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    (filterBy && filterBy !== 'all') ||
    (sortBy && sortBy !== 'default');

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {filterOptions && filterOptions.length > 0 && onFilterChange && (
          <Select value={filterBy} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={filterLabel} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="icon" onClick={onReset} title="Réinitialiser">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {resultCount != null && totalCount != null && (
        <p className="text-xs text-muted-foreground">
          {resultCount} résultat{resultCount !== 1 ? 's' : ''} sur {totalCount}
        </p>
      )}
    </div>
  );
}
