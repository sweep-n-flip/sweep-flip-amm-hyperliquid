import { ChevronDown, ChevronUp } from "lucide-react";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  onSort: (sortKey: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const SortableTableHeader = ({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = '',
  align = 'left'
}: SortableTableHeaderProps) => {
  const isActive = currentSortBy === sortKey;
  
  const handleSort = () => {
    if (isActive) {
      if (currentSortOrder === 'asc') {
        // Se está asc, vai para desc
        onSort(sortKey, 'desc');
      } else {
        // Se está desc, limpa a ordenação (volta ao padrão)
        onSort('', 'desc'); // String vazia indica que não há ordenação personalizada
      }
    } else {
      // Se não está ativo, começa com asc (primeiro clique)
      onSort(sortKey, 'asc');
    }
  };

  const textAlign = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <button
      onClick={handleSort}
      className={`flex items-center gap-1 transition-colors h-full w-full ${textAlign} ${className} `}
    >
      <span className={`text-sm font-semibold whitespace-nowrap transition-colors ${
        isActive ? 'text-white' : 'text-white'
      }`}>
        {label}
      </span>
      <div className="flex flex-col">
        <ChevronUp 
          className={`w-3 h-3 transition-colors ${
        isActive && currentSortOrder === 'asc' 
          ? 'text-[#ffffff]' 
          : 'text-[#bfbfbf]'
          }`} 
        />
        <ChevronDown 
          className={`w-3 h-3 -mt-1 transition-colors ${
        isActive && currentSortOrder === 'desc' 
          ? 'text-[#ffffff]' 
          : 'text-[#bfbfbf]'
          }`} 
        />
      </div>
    </button>
  );
};
