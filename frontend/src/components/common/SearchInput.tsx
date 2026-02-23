import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchInput = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  return (
    <form onSubmit={handleSearchSubmit} className={`flex items-center transition-all duration-300 ${searchQuery ? 'w-64' : 'w-64'}`}>
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-3 pr-10 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-primary bg-background/50 backdrop-blur-sm"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
export default SearchInput;