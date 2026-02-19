import HeroModel from "../../assets/images/hero-model.jpg";
import axios from "axios";
import { apiUrl } from "../../utils/api";
import { useEffect, useState } from "react";
import type { Category } from "../../types/types";
const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState(0);


  useEffect(() => {
    axios.get(`${apiUrl('/categories')}`).then((response) => {
      setCategories(response.data);
    });
  }, []);
  return (
    <div className="w-100% mx-20 py-20">
      <h1 className="text-2xl font-bold text-center text-left pt-10 pb-2">Shop by category</h1>
      <div className="flex gap-2 w-full h-[400px]">
        {categories.map((category, index) => (
          <div
            key={category._id}
            onMouseEnter={() => setHoveredIndex(index)}
            className={`relative h-full transition-all duration-500 ease-in-out cursor-pointer overflow-hidden rounded-2xl
        ${hoveredIndex === index ? "flex-[4]" : "flex-1"}`}
          >
            <img
              src={HeroModel}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Text - only fully visible on hover */}
            <div className={`absolute bottom-5 left-5 transition-opacity duration-300 ${hoveredIndex === index ? "opacity-100" : "opacity-0"}`}>
              <h2 className="text-white text-2xl font-bold uppercase">{category.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;