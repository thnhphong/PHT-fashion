import { useEffect, useState } from 'react';
import type { Category } from '../../types/types'
import axios from 'axios';
import { apiUrl } from '../../utils/api';
import { Link } from 'react-router-dom';

const MenuDropdown = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

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
  }

  return (
    <div className="relative">
      <button className="bg-white text-black border border-black px-4 py-2 rounded-full">Menu</button>
      {/* loading category dropdown*/}
      <div className="absolute top-10 left-0 w-48 bg-white text-black border border-black rounded-lg">
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <li key={category._id} className="text-sm">
              <Link to={`/products?category=${category._id}`}>{category.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MenuDropdown;