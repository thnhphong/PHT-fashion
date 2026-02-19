
import type { Product } from "../types/types";
import { useCart } from "../context/CartContext";

const handleAddToCart = (product: Product) => {
    const { addToCart, setShowCartPopup } = useCart();  
    addToCart(product, product.sizes[0].size, 1);
    setShowCartPopup(true);
};

export default handleAddToCart;