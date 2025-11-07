import * as CircleCI from "@ndelangen/circleci-config-sdk";
import { errorParsing, parseGenerable } from "../../Config/exports/Parsing";
import { Validator } from "../../Config/exports/Validator";
import { parseSteps } from "../Commands";

const parameterMappings: {
  [key in Exclude<
    CircleCI.types.parameter.literals.AnyParameterLiteral,
    CircleCI.types.parameter.literals.EnumParameterLiteral
  >]: CircleCI.mapping.ParameterSubEnum;
} = {
  string: CircleCI.mapping.ParameterSubEnum.STRING,
  boolean: CircleCI.mapping.ParameterSubEnum.BOOLEAN,
  integer: CircleCI.mapping.ParameterSubEnum.INTEGER,
  executor: CircleCI.mapping.ParameterSubEnum.EXECUTOR,
  steps: CircleCI.mapping.ParameterSubEnum.STEPS,
  env_var_name: CircleCI.mapping.ParameterSubEnum.ENV_VAR_NAME,
};

/**
 * Parse a single parameter.
 * @param customParamIn - Unknown parameter object.
 * @param name - Name of the parameter.
 * @param subtype - Subtype of the parameter. Required for all non-enum typed parameters.
 * @returns A custom parameter.
 * @throws Error if a valid executor type is not found on the object.
 */
export function parseParameter(
  customParamIn: unknown,
  name: string
): CircleCI.parameters.CustomParameter<CircleCI.types.parameter.literals.AnyParameterLiteral> {
  let type = undefined;

  if (customParamIn && typeof customParamIn === "object") {
    const typeEntry = Object.entries(customParamIn).find(
      ([key]) => key === "type"
    );

    if (!typeEntry) {
      throw errorParsing(`Missing type property on parameter: ${name}`);
    } else {
      type = typeEntry[1];
    }
  }

  if (type === "enum") {
    return parseGenerable<
      CircleCI.types.parameter.CustomEnumParameterContentsShape,
      CircleCI.parameters.CustomEnumParameter
    >(
      CircleCI.mapping.GenerableEnum.CUSTOM_ENUM_PARAMETER,
      customParamIn,
      (customEnumParam) => {
        return new CircleCI.parameters.CustomEnumParameter(
          name,
          customEnumParam.enum,
          customEnumParam.default,
          customEnumParam.description
        );
      },
      undefined,
      name
    );
  }

  return parseGenerable<
    CircleCI.types.parameter.CustomParameterContentsShape<CircleCI.types.parameter.literals.AnyParameterLiteral>,
    CircleCI.parameters.CustomParameter<CircleCI.types.parameter.literals.AnyParameterLiteral>
  >(
    CircleCI.mapping.GenerableEnum.CUSTOM_PARAMETER,
    customParamIn,
    (customParam) => {
      let defaultValue = customParam.default;

      if (customParam.type === "steps" && defaultValue) {
        defaultValue = parseSteps(defaultValue);
      }

      return new CircleCI.parameters.CustomParameter(
        name,
        customParam.type,
        defaultValue,
        customParam.description
      );
    },
    undefined,
    name,
    parameterMappings[type as unknown as keyof typeof parameterMappings]
  );
}

/**
 * Parse a list of parameters.
 * @param customParamIn - Unknown parameter object.
 * @param name - Name of the parameter.
 * @param subtype - Subtype of the parameter. Required for all but enum typed parameters.
 * @returns A custom parameter.
 * @throws Error if parameter list, or at least one parameter is not valid.
 */
export function parseParameterList(
  customParamListIn: unknown,
  subtype?: CircleCI.mapping.ParameterizedComponentEnum
): CircleCI.parameters.CustomParametersList<CircleCI.types.parameter.literals.AnyParameterLiteral> {
  if (subtype) {
    const valid = Validator.validateGenerable(
      CircleCI.mapping.GenerableEnum.CUSTOM_PARAMETERS_LIST,
      customParamListIn,
      subtype
    );

    if (valid !== true) {
      throw errorParsing(
        "Could not find valid parameter list in provided object"
      );
    }
  }

  const customParamList =
    customParamListIn as CircleCI.types.parameter.CustomParametersListShape;
  return new CircleCI.parameters.CustomParametersList(
    Object.entries(customParamList).map(([name, properties]) =>
      parseParameter(properties, name)
    )
  );
}
