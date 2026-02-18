export const findOne = async ({
  model,
  filter = {},
  select = "",
  options = {},
} = {}) => {
  let query = model.findOne(filter).select(select);

  if (options.populate) {
    query = query.populate(options.populate);
  }

  if (options.lean) {
    query = query.lean();
  }

  if (options.sort) {
    query = query.sort(options.sort);
  }

  return await query.exec();
};

export const create = async ({
  model,
  data = [{}],
  options = { validationBeforeSave: true },
} = {}) => {
  return await model.create(data, options);
};

export const createOne = async ({
  model,
  data = {},
  options = { validationBeforeSave: true },
} = {}) => {
  const [doc] = await create({ model, data: [data], options });
  return doc;
};
