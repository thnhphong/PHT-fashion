import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { apiUrl } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/types";

interface CategoryWithImage {
  _id: string;
  name: string;
  img_url: string;
}

const CategorySection = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${apiUrl('/products')}?limit=100`).then((response) => {
      setProducts(response.data.data);
    });
  }, []);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithImage>();
    
    products.forEach((product) => {
      const catId = typeof product.categoryId === 'object' 
        ? product.categoryId._id 
        : product.categoryId;
      const catName = typeof product.categoryId === 'object' 
        ? product.categoryId.name 
        : '';
      
      if (catId && catName && !categoryMap.has(catId)) {
        categoryMap.set(catId, {
          _id: catId,
          name: catName,
          img_url: product.img_url,
        });
      }
    });
    
    return Array.from(categoryMap.values());
  }, [products]);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="w-100% mx-20 py-20">
      <h1 className="text-2xl font-bold text-center text-left pt-10 pb-2">{t('home.shopByCategory')}</h1>
      <div className="flex gap-2 w-full h-[400px]">
        {categories.map((category, index) => (
          <div
            key={category._id}
            onMouseEnter={() => setHoveredIndex(index)}
            onClick={() => handleCategoryClick(category.name)}
            className={`relative h-full transition-all duration-500 ease-in-out cursor-pointer overflow-hidden rounded-2xl
        ${hoveredIndex === index ? "flex-[4]" : "flex-1"}`}
          >
            <img
              src={category.img_url}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Text - only fully visible on hover */}
            <div className={`absolute bottom-5 left-5 transition-opacity duration-300 ${hoveredIndex === index ? "opacity-100" : "opacity-0"}`}>
              <h2 className="text-black text-2xl font-bold uppercase">{category.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
