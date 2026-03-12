export const successResponse = ({
  res,
  message = "Done",
  status = 200,
  data = undefined,
} = {}) => {
    res.status(status).json({message ,status, data})
};
