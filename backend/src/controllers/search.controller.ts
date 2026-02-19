import { Request, Response } from 'express';
import { ApiError } from '../utils/api-error';
import { searchProducts, getFilterOptions } from '../services/search.service';


export const searchProductsController = async (req: Request, res: Response) => {
  try {
    const {
      q, 
      category,
      minPrice, 
      maxPrice, 
      supplier,  //supplier filter
      color, 
      size, 
      sort, 
      page = 1, 
      limit = 20
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new ApiError(400, 'Invalid page or limit');
    }
    const filters = {
      searchQuery: q as string || '',
      category: category as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      supplier: supplier as string,
      color: color as string,
      size: size as string,
      sort: sort as string || 'relevance',
      page: pageNum,
      limit: limitNum
    }

    const results = await searchProducts(filters);

    return res.status(200).json({
      success: true,
      data: results.products,
      pagination: {
        currentPage: pageNum,
        totalPages: results.totalPages,
        totalProducts: results.totalProducts,
        hasNext: pageNum < results.totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum
      },
      filters: results.appliedFilters,
      message: `Found ${results.totalProducts} products matching your search`
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during search'
    });
  }
}

export const getFiltersController = async (req: Request, res: Response) => {
  try {
    const { q, category, supplier, color, size } = req.query;

    const filterOptions = await getFilterOptions({
      searchQuery: q as string,
      category: category as string,
      supplier: supplier as string, 
      color: color as string,
      size: size as string
    });

    return res.status(200).json({
      success: true,
      data: filterOptions,
      message: 'Filter options retrieved successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Get filters error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSuggestionsController = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Query too short'
      });
  }
  const suggestions = await searchProducts({
    searchQuery: q as string,
    limit: 5,
    page: 1
  })
  const suggestionList = suggestions.products.map((p: any) => ({
      name: p.name,
      category: p.categoryId,
      price: p.price
    }));
    return res.status(200).json({
      success: true, 
      data: suggestionList,
      message: 'Suggestions retrieved successfully'
    });
  }catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}