import { useEffect, useState, useRef } from 'react';
import type { Category } from '../../types/types';
import axios from 'axios';
import { apiUrl } from '../../utils/api';
import { Link } from 'react-router-dom';

const MenuDropdown = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl('/admin/categories')}`);
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Menu
        <svg 
          aria-hidden="true" 
          className="-mr-1 h-5 w-5 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="py-1">
            {loading && (
              <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
            )}
            
            {error && (
              <div className="px-4 py-2 text-sm text-red-600">{error}</div>
            )}
            
            {!loading && !error && categories.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">No categories available</div>
            )}
            
            {!loading && !error && categories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuDropdown;