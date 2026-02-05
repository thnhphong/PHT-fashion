import { motion } from "framer-motion";
import ProductCard from "../ui/ProductCard";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../utils/api";

import { useState, useEffect } from "react";

interface IProductSize {
  size: string;
  stock: number;
}

interface ICategory {
  _id: string;
  name: string;
}


interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: ICategory;
  supplierId: string;
  stock: number;
  img_url: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes: IProductSize[];
  created_at: Date;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  
  useEffect(() => {
    axios.get(`${apiUrl('products')}`).then((response) => {
      setProducts(response.data);
    });
  }, []);
  
  return (
    <section id="products" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Bestsellers
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-2">
            The Best Items of Our Collection
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Explore our curated selection of premium streetwear pieces that define
            the essence of urban fashion.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} id={product._id} name={product.name} price={product.price} image={product.img_url} />
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button variant="default" size="lg" className="group">
            View All Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};


export default FeaturedProducts;
