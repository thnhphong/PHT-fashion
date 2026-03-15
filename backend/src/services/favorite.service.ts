import Favorite from '../models/Favorite';
import { Types } from 'mongoose';

const populateFavorites = (query: { populate: (opts: object) => unknown }) =>
  query.populate({
    path: 'productIds',
    select: 'name price img_url stock sizes categoryId supplierId',
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'supplierId', select: 'name' },
    ],
  });

export const getFavorites = async (userId: string) => {
  const userObjId = new Types.ObjectId(userId);
  let fav = await populateFavorites(
    Favorite.findOne({ userId: userObjId }) as { populate: (opts: object) => unknown }
  );
  if (!fav) {
    fav = await Favorite.create({ userId: userObjId, productIds: [] });
  }
  return fav;
};

export const addFavorite = async (userId: string, productId: string) => {
  const userObjId = new Types.ObjectId(userId);
  let fav = await Favorite.findOne({ userId: userObjId });
  if (!fav) {
    fav = new Favorite({ userId: userObjId, productIds: [] });
  }

  const pid = new Types.ObjectId(productId);
  if (!fav.productIds.some((id: any) => id.equals(pid))) {
    fav.productIds.push(pid as any);
    await fav.save();
  }

  return populateFavorites(Favorite.findById(fav._id) as { populate: (opts: object) => unknown });
};

export const removeFavorite = async (userId: string, productId: string) => {
  const userObjId = new Types.ObjectId(userId);
  const fav = await Favorite.findOne({ userId: userObjId });
  if (!fav) throw new Error('Favorites not found');

  fav.productIds = fav.productIds.filter(
    (id: any) => id.toString() !== productId
  );
  await fav.save();

  return populateFavorites(Favorite.findById(fav._id) as { populate: (opts: object) => unknown });
};

export const mergeFavorites = async (userId: string, productIds: string[]) => {
  const userObjId = new Types.ObjectId(userId);
  let fav = await Favorite.findOne({ userId: userObjId });
  if (!fav) {
    fav = new Favorite({ userId: userObjId, productIds: [] });
  }

  for (const productId of productIds) {
    const pid = new Types.ObjectId(productId);
    if (!fav.productIds.some((id: any) => id.equals(pid))) {
      fav.productIds.push(pid as any);
    }
  }

  await fav.save();
  return populateFavorites(Favorite.findById(fav._id) as { populate: (opts: object) => unknown });
};
