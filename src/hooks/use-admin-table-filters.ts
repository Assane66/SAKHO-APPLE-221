import { useMemo, useState, useRef } from 'react';

export type SortOption = { value: string; label: string };
export type FilterOption = { value: string; label: string };

type AdminTableFiltersConfig<T> = {
  searchFn?: (item: T, term: string) => boolean;
  filterFn?: (item: T, filter: string) => boolean;
  sortFn?: (a: T, b: T, sortBy: string) => number;
  defaultSort?: string;
  defaultFilter?: string;
};

export function useAdminTableFilters<T>(
  items: T[],
  config: AdminTableFiltersConfig<T> = {}
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(config.defaultSort ?? 'default');
  const [filterBy, setFilterBy] = useState(config.defaultFilter ?? 'all');
  const configRef = useRef(config);
  configRef.current = config;

  const filtered = useMemo(() => {
    const { searchFn, filterFn, sortFn } = configRef.current;
    let result = [...items];

    if (searchTerm.trim() && searchFn) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(item => searchFn(item, term));
    }

    if (filterBy !== 'all' && filterFn) {
      result = result.filter(item => filterFn(item, filterBy));
    }

    if (sortBy !== 'default' && sortFn) {
      result.sort((a, b) => sortFn(a, b, sortBy));
    }

    return result;
  }, [items, searchTerm, sortBy, filterBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSortBy(config.defaultSort ?? 'default');
    setFilterBy(config.defaultFilter ?? 'all');
  };

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    filtered,
    resetFilters,
    resultCount: filtered.length,
    totalCount: items.length,
  };
}

export function sortByString(a: string, b: string, direction: 'asc' | 'desc' = 'asc') {
  const cmp = a.localeCompare(b, 'fr', { sensitivity: 'base' });
  return direction === 'asc' ? cmp : -cmp;
}

export function sortByNumber(a: number, b: number, direction: 'asc' | 'desc' = 'asc') {
  return direction === 'asc' ? a - b : b - a;
}

export function sortByDate(
  a: { seconds?: number } | undefined,
  b: { seconds?: number } | undefined,
  direction: 'asc' | 'desc' = 'desc'
) {
  const dateA = a?.seconds ?? 0;
  const dateB = b?.seconds ?? 0;
  return direction === 'asc' ? dateA - dateB : dateB - dateA;
}

export function searchInFields(item: Record<string, unknown>, term: string, fields: string[]) {
  return fields.some(field => {
    const value = item[field];
    if (value == null) return false;
    if (Array.isArray(value)) {
      return value.some(v => String(v).toLowerCase().includes(term));
    }
    return String(value).toLowerCase().includes(term);
  });
}
