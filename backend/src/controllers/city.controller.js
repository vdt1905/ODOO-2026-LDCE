import { City } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const SORTS = {
  popularity: { popularity: -1 },
  'cost-asc': { costIndex: 1 },
  'cost-desc': { costIndex: -1 },
  name: { name: 1 },
};

/** GET /cities?search=&country=&region=&sort=&page=&limit= */
export const listCities = asyncHandler(async (req, res) => {
  const { search = '', country = '', region = '', sort = 'popularity' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));

  const filter = {};
  if (search.trim()) filter.name = { $regex: search.trim(), $options: 'i' };
  if (country) filter.country = country;
  if (region) filter.region = region;

  const maxCost = Number(req.query.maxCost);
  if (req.query.maxCost !== '' && req.query.maxCost !== undefined && Number.isFinite(maxCost)) {
    filter.costIndex = { $lte: maxCost };
  }

  const minPopularity = Number(req.query.minPopularity);
  if (
    req.query.minPopularity !== '' &&
    req.query.minPopularity !== undefined &&
    Number.isFinite(minPopularity)
  ) {
    filter.popularity = { $gte: minPopularity };
  }

  const [items, total] = await Promise.all([
    City.find(filter)
      .sort(SORTS[sort] || SORTS.popularity)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    City.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /cities/popular — powers "Top Regional Selections" on the landing page. */
export const popularCities = asyncHandler(async (req, res) => {
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 8));
  const items = await City.find().sort({ popularity: -1 }).limit(limit).lean();
  return sendSuccess(res, { data: { items } });
});

export const getCity = asyncHandler(async (req, res) => {
  const city = await City.findById(req.params.id).lean();
  if (!city) throw ApiError.notFound('City not found');
  return sendSuccess(res, { data: { city } });
});
