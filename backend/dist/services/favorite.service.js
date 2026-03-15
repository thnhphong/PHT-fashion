"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeFavorites = exports.removeFavorite = exports.addFavorite = exports.getFavorites = void 0;
const Favorite_1 = __importDefault(require("../models/Favorite"));
const mongoose_1 = require("mongoose");
const populateFavorites = (query) => query.populate({
    path: 'productIds',
    select: 'name price img_url stock sizes categoryId supplierId',
    populate: [
        { path: 'categoryId', select: 'name' },
        { path: 'supplierId', select: 'name' },
    ],
});
const getFavorites = async (userId) => {
    const userObjId = new mongoose_1.Types.ObjectId(userId);
    let fav = await populateFavorites(Favorite_1.default.findOne({ userId: userObjId }));
    if (!fav) {
        fav = await Favorite_1.default.create({ userId: userObjId, productIds: [] });
    }
    return fav;
};
exports.getFavorites = getFavorites;
const addFavorite = async (userId, productId) => {
    const userObjId = new mongoose_1.Types.ObjectId(userId);
    let fav = await Favorite_1.default.findOne({ userId: userObjId });
    if (!fav) {
        fav = new Favorite_1.default({ userId: userObjId, productIds: [] });
    }
    const pid = new mongoose_1.Types.ObjectId(productId);
    if (!fav.productIds.some((id) => id.equals(pid))) {
        fav.productIds.push(pid);
        await fav.save();
    }
    return populateFavorites(Favorite_1.default.findById(fav._id));
};
exports.addFavorite = addFavorite;
const removeFavorite = async (userId, productId) => {
    const userObjId = new mongoose_1.Types.ObjectId(userId);
    const fav = await Favorite_1.default.findOne({ userId: userObjId });
    if (!fav)
        throw new Error('Favorites not found');
    fav.productIds = fav.productIds.filter((id) => id.toString() !== productId);
    await fav.save();
    return populateFavorites(Favorite_1.default.findById(fav._id));
};
exports.removeFavorite = removeFavorite;
const mergeFavorites = async (userId, productIds) => {
    const userObjId = new mongoose_1.Types.ObjectId(userId);
    let fav = await Favorite_1.default.findOne({ userId: userObjId });
    if (!fav) {
        fav = new Favorite_1.default({ userId: userObjId, productIds: [] });
    }
    for (const productId of productIds) {
        const pid = new mongoose_1.Types.ObjectId(productId);
        if (!fav.productIds.some((id) => id.equals(pid))) {
            fav.productIds.push(pid);
        }
    }
    await fav.save();
    return populateFavorites(Favorite_1.default.findById(fav._id));
};
exports.mergeFavorites = mergeFavorites;
