import { NODE_ENV } from "../../../../config/config.service.js";

export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  return res.status(status).json({
    error_message:
      status == 500
        ? "something went wrong"
        : (error.message ?? "something went wrong"),
    stack: NODE_ENV == "development" ? error.stack : undefined,
    extra: error.cause?.extra,
  });
};

export const ErrorException = ({
  message = "Fail",
  cause = undefined,
} = {}) => {
  throw new Error(message, { cause });
};

export const NotFoundException = ({
  message = "NotFoundException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 404, extra } });
};
export const ConflictException = ({
  message = "ConflictException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 409, extra } });
};
export const UnauthorizedException = ({
  message = "UnauthorizedException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 401, extra } });
};
export const BadRequestException = ({
  message = "BadRequestException",
  extra = undefined,
} = {}) => {
  throw ErrorException({ message, cause: { status: 400, extra } });
};
