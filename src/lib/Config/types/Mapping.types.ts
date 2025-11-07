import { SchemaObject } from "ajv";
import * as CircleCI from "@ndelangen/circleci-config-sdk";

export type GenerableSubtypes =
  | CircleCI.mapping.ParameterSubtype
  | CircleCI.mapping.ParameterizedComponent;

export type GenerableSubTypesMap = {
  [CircleCI.mapping.GenerableEnum.CUSTOM_PARAMETER]: {
    [key in GenerableSubtypes]: SchemaObject;
  };
  [CircleCI.mapping.GenerableEnum.CUSTOM_PARAMETERS_LIST]: {
    [key in CircleCI.mapping.ParameterizedComponent]: SchemaObject;
  };
};
export type OneOrMoreGenerable =
  | CircleCI.types.config.Generable
  | CircleCI.types.config.Generable[];
