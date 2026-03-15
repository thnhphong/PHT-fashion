import Favorite from '../models/Favorite';
import { Types } from 'mongoose';


const populateFavorites = (query: any) =>
  query.populate({
    path: 'productIds',
    select: 'name price img_url stock sizes categoryId supplierId',
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'supplierId', select: 'name' },
    ],
  });

export const getFavorites = async (userId: string) => {
  let fav = await populateFavorites(
    Favorite.findOne({ userId })
  );
  if (!fav) {
    fav = await Favorite.create({ userId, productIds: [] });
  }
  return fav;
};

export const addFavorite = async (userId: string, productId: string) => {
  let fav = await Favorite.findOne({ userId });
  if (!fav) {
    fav = new Favorite({ userId, productIds: [] });
  }

  const pid = new Types.ObjectId(productId);
  if (!fav.productIds.some((id: any) => id.equals(pid))) {
    fav.productIds.push(pid as any);
    await fav.save();
  }

  return populateFavorites(Favorite.findById(fav._id));
};

export const removeFavorite = async (userId: string, productId: string) => {
  const fav = await Favorite.findOne({ userId });
  if (!fav) throw new Error('Favorites not found');

  fav.productIds = fav.productIds.filter(
    (id: any) => id.toString() !== productId
  );
  await fav.save();

  return populateFavorites(Favorite.findById(fav._id));
};

export const mergeFavorites = async (userId: string, productIds: string[]) => {
  let fav = await Favorite.findOne({ userId });
  if (!fav) {
    fav = new Favorite({ userId, productIds: [] });
  }

  for (const productId of productIds) {
    const pid = new Types.ObjectId(productId);
    if (!fav.productIds.some((id: any) => id.equals(pid))) {
      fav.productIds.push(pid as any);
    }
  }

  await fav.save();
  return populateFavorites(Favorite.findById(fav._id));
};
