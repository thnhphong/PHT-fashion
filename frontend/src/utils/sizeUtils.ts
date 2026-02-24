export const ONE_SIZE_VALUE = 'ONE_SIZE';

const SIZELESS_CATEGORIES = ['bags', 'hats', 'socks'];

export const formatSizeLabel = (size: string) =>
  size === ONE_SIZE_VALUE ? 'One size' : size || 'Size not specified';

export const shouldShowSizeSelection = (
  categoryName?: string,
  sizes?: { size: string }[]
) => {
  if (!Array.isArray(sizes) || sizes.length === 0) return false;
  if (!categoryName) return true;
  return !SIZELESS_CATEGORIES.includes(categoryName.toLowerCase());
};
