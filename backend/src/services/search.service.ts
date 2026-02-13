import Product, { IProduct } from '../models/Product';
import Category, { ICategory } from '../models/Category';
import Supplier, { ISupplier } from '../models/Supplier';
import categoryService from './category.service';
interface SearchFilters {
  searchQuery?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  supplier?: string;
  color?: string;
  size?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface SearchResults {
  products: any[];
  totalProducts: number;
  totalPages: number;
  appliedFilters: any;
}

export const searchProducts = async (filters: SearchFilters): Promise<SearchResults> => {
  const {
    searchQuery,
    category,
    minPrice,
    maxPrice,
    supplier,
    color,
    size,
    sort = 'relevance',
    page = 1,
    limit = 20
  } = filters;
  const query: any = {};
  const trimmedSearchTerm = searchQuery?.trim();
  const hasTextSearch = Boolean(trimmedSearchTerm);

  if (hasTextSearch) {
    const categoryIds = await Category.find({
      name: { $regex: trimmedSearchTerm, $options: 'i' }
    }).distinct('_id');

    query.$or = [
      { $text: { $search: trimmedSearchTerm } },
      { categoryId: { $in: categoryIds } }
    ];
  }
  //category filter 
  if (category) {
    try {
      const categoryDoc = await Category.findOne({
        name: { $regex: new RegExp(`^${category}$`, 'i') }
      })
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      }
    } catch (error) {
      console.error('Category filter error:', error);
    }
  }
  //price range filter 
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) {
      query.price.$gte = minPrice;
    }
    if (maxPrice !== undefined) {
      query.price.$lte = maxPrice;
    }
  }

  // Supplier filter
  if (supplier) {
    try {
      const supplierDoc = await Supplier.findOne({
        name: { $regex: new RegExp(`^${supplier}$`, 'i') }
      });
      if (supplierDoc) {
        query.supplierId = supplierDoc._id;
      }
    } catch (error) {
      console.error('Supplier filter error:', error);
    }
  }
  // Size filter
  if (size) {
    query['sizes.size'] = size.toUpperCase();
  }
  // Color filter (basic implementation - you can enhance with embeddings later)
  // if (color) {
  //   // Simple color matching in product name or description
  //   query.$and = query.$and || [];
  //   query.$and.push({
  //     $or: [
  //       { name: { $regex: color, $options: 'i' } },
  //       { description: { $regex: color, $options: 'i' } }
  //     ]
  //   });
  // }
  // Ensure stock > 0
  query.stock = { $gt: 0 };
  // Build sort options
  let sortOptions: any = {};
  switch (sort) {
    case 'price-asc':
      sortOptions = { price: 1 };
      break;
    case 'price-desc':
      sortOptions = { price: -1 };
      break;
    case 'newest':
      sortOptions = { created_at: -1 };
      break;
    case 'name-asc':
      sortOptions = { name: 1 };
      break;
    case 'name-desc':
      sortOptions = { name: -1 };
      break;
    default:
      // Relevance - if search query exists, use text score
      if (hasTextSearch) {
        sortOptions = { score: { $meta: 'textScore' } };
      } else {
        sortOptions = { created_at: -1 };
      }
  }
  //calculate pagination
  const skip = (page - 1) * limit;
  try {
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .populate('supplierId', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      totalProducts,
      totalPages,
      appliedFilters: {
        searchQuery: trimmedSearchTerm || '',
        category,
        minPrice,
        maxPrice,
        supplier,
        color,
        size,
        sort
      }
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export const getFilterOptions = async (context?: {
  searchQuery?: string;
  category?: string;
  supplier?: string;
  color?: string;
  size?: string;
}) => {
  try {
    const query: any = {}

    if (context?.searchQuery) {
      query.$or = [
        { name: { $regex: context.searchQuery, $options: 'i' } },
        { description: { $regex: context.searchQuery, $options: 'i' } },
      ]
    }
    if (context?.category) {
      const categoryDoc = await Category.findOne({
        name: { $regex: new RegExp(`^${context.category}$`, 'i') }
      });
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      }
    }
    // Get all products matching the context
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .populate('supplierId', 'name')
      .lean();

    // Get all categories for filter options
    const allCategories = await categoryService.getCategories();
    const categoriesFn = allCategories.map((cat: any) => {
      let isSelected = false;
      if (context?.category) {
        isSelected = cat.name.toLowerCase() === context.category.toLowerCase();
      } else if (context?.searchQuery) {
        isSelected = cat.name.toLowerCase() === context.searchQuery.toLowerCase();
      }

      return {
        _id: cat._id,
        name: cat.name,
        isSelected
      };
    });

    //extract unique values for filters
    // const categories = new Set<string>(); // Removed in favor of categoriesFn
    const suppliers = new Set<string>();
    const sizes = new Set<string>();
    const colors = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    products.forEach(product => {
      // Categories - processed above

      // Suppliers
      if (product.supplierId && typeof product.supplierId === 'object') {
        suppliers.add((product.supplierId as any).name);
      }

      // Sizes
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((s: any) => {
          if (s.size) sizes.add(s.size);
        });
      }

      // Price range
      if (product.price < minPrice) minPrice = product.price;
      if (product.price > maxPrice) maxPrice = product.price;

      // Colors (extract from name/description - basic implementation)
      const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey'];
      const text = `${product.name} ${product.description}`.toLowerCase();
      colorKeywords.forEach(color => {
        if (text.includes(color)) {
          colors.add(color.charAt(0).toUpperCase() + color.slice(1));
        }
      });
    });
    return {
      categories: categoriesFn,
      suppliers: Array.from(suppliers).sort(),
      sizes: Array.from(sizes).sort((a, b) => {
        const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        return order.indexOf(a) - order.indexOf(b);
      }),
      colors: Array.from(colors).sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: maxPrice === -Infinity ? 1000 : Math.ceil(maxPrice)
      },
      totalProducts: products.length
    };
  } catch (error) {
    console.error('Get filter options error:', error);
    throw error;
  }
}

// Helper function to extract colors from product (can be enhanced with ML/embeddings)
export const extractProductColors = (product: any): string[] => {
  const colors: string[] = [];
  const colorMap: { [key: string]: string[] } = {
    red: ['red', 'crimson', 'scarlet', 'burgundy', 'maroon'],
    blue: ['blue', 'navy', 'azure', 'cobalt', 'sapphire'],
    green: ['green', 'emerald', 'olive', 'lime', 'forest'],
    yellow: ['yellow', 'gold', 'amber', 'mustard'],
    black: ['black', 'ebony', 'charcoal', 'jet'],
    white: ['white', 'ivory', 'cream', 'pearl'],
    pink: ['pink', 'rose', 'magenta', 'fuchsia'],
    purple: ['purple', 'violet', 'lavender', 'plum'],
    orange: ['orange', 'coral', 'peach', 'tangerine'],
    brown: ['brown', 'tan', 'beige', 'khaki', 'camel'],
    gray: ['gray', 'grey', 'silver', 'slate']
  };

  const text = `${product.name} ${product.description}`.toLowerCase();

  Object.entries(colorMap).forEach(([baseColor, variants]) => {
    if (variants.some(variant => text.includes(variant))) {
      colors.push(baseColor.charAt(0).toUpperCase() + baseColor.slice(1));
    }
  });

  return [...new Set(colors)];
};