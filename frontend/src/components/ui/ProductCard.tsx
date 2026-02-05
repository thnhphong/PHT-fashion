import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isSale?: boolean;
  isExclusive?: boolean;
}

const ProductCard = ({
  name,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  isNew,
  isSale,
  isExclusive,
}: ProductCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="product-card group"
    >
      {/* Image Container */}
      <div className="relative aspect-[1/1] overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="product-image w-full h-full object-cover"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full">
              NEW
            </span>
          )}
          {isSale && discount > 0 && (
            <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
              -{discount}%
            </span>
          )}
          {isExclusive && (
            <span className="px-3 py-1 bg-gradient-to-r from-gold to-amber-400 text-background text-xs font-bold rounded-full">
              EXCLUSIVE
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isLiked
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </button>

        {/* Hover Overlay */}
        <div className="product-overlay">
          <div className="flex gap-3">
            <Button variant="default" size="lg" className="gap-2">
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Eye className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.floor(rating)
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                  }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-foreground">${price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${originalPrice}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
