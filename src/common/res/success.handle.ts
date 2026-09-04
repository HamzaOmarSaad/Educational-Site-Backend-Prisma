import { ISuccess } from "../types/res.type";

export const successResult = ({
  res,
  message,
  data = {},
  statusCode = 200,
}: ISuccess) => {
  return res.status(statusCode).json({
    message,
    statusCode,
    data,
  });
};
