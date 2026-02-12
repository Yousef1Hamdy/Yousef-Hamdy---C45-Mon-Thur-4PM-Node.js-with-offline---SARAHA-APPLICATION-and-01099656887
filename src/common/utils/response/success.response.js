export const successResponse = ({
  res,
  message,
  status = 200,
  data = undefined,
} = {}) => {
    res.status(status).json({message , data})
};
