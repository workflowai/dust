import type { LoggerOptions } from "pino";
import type pino from "pino";

export type CheckFunction = (
  checkName: string,
  logger: pino.Logger<LoggerOptions>,
  reportSuccess: (reportPayload: unknown) => void,
  reportFailure: (reportPayload: unknown, message: string) => void,
  heartbeat: () => void
) => Promise<void>;

export type Check = {
  name: string;
  check: CheckFunction;
  everyHour: number;
};
