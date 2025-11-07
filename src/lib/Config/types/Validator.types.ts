import * as CircleCI from "@ndelangen/circleci-config-sdk";
import { ErrorObject, SchemaObject } from "ajv";
import { GenerableSubTypesMap } from "./Mapping.types";

export type ValidationResult =
  | boolean
  | {
      schema: SchemaObject;
      data: unknown;
      errors: ErrorObject<string, Record<string, unknown>, unknown>[];
    };

export type ValidationMap = GenerableSubTypesMap & {
  [key in CircleCI.mapping.GenerableEnum]: SchemaObject;
};
