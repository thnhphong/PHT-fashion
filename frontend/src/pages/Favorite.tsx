import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../utils/api';
import { Button } from '../components/ui/button';
import type { Product } from '../types/types';
import { useFavorite } from '../context/useFavorite';
import { Heart } from 'lucide-react';


const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);

export default function Favorite() {
  const { favorites, removeFavorite } = useFavorite();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (favorites.length === 0) {
      setFavoriteProducts([]);
      return;
    }

    const controller = new AbortController();
    const loadFavorites = async () => {
      try {
        const results = await Promise.all(
          favorites.map(async (id) => {
            const response = await axios.get(`${apiUrl(`/products/${id}`)}`, {
              signal: controller.signal,
            });
            return response.data;
          })
        );
        setFavoriteProducts(results);
      } catch (error) {
        if (axios.isCancel(error)) return;
        console.error('Unable to load favorite products', error);
      }
    };

    loadFavorites();

    return () => controller.abort();
  }, [favorites]);

  const getCategoryName = (product: Product) => {
    if (!product?.categoryId) {
      return 'Category';
    }
    if (typeof product.categoryId === 'string') {
      return 'Category';
    }
    return product.categoryId.name;
  };

  return (
    <section className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Favorites</h1>
          <Link
            to="/"
            className="text-sm font-medium text-orange-500 hover:text-orange-600 underline-offset-2 underline"
          >
            Continue browsing
          </Link>
        </div>

        {favoriteProducts.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-lg text-gray-600 mb-4">
              You haven&apos;t marked any products as favorites yet.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg" className="mx-auto">
                Browse products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteProducts.map((product) => (
              <article
                key={product._id}
                className="flex flex-col rounded-[1.25rem] overflow-hidden bg-white shadow-lg border border-gray-100"
              >
                <Link to={`/product/${product._id}`} className="group block h-full">
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 transition duration-300">
                    <img
                      src={product.img_url}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      {getCategoryName(product)}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h2>
                    <p className="text-xl font-bold text-orange-500">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-2 px-4 pb-4">
                  <Button
                    type="button"
                    className="flex-1"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFavorite(product._id)}
                  >
                    Remove
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/product-detail/${product._id}`}>View</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

