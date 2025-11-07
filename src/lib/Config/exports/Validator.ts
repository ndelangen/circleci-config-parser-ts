import Ajv, { ErrorObject, SchemaObject } from 'ajv';
import { ValidationMap, ValidationResult } from '../types/Validator.types';

import { schemas } from '../../..';
import { mapping, types } from '@ndelangen/circleci-config-sdk';

const schemaRegistry: ValidationMap = {
  [mapping.GenerableEnum.ORB]: {},
  [mapping.GenerableEnum.ORB_IMPORT]: {},
  [mapping.GenerableEnum.ORB_REF]: {},

  [mapping.GenerableEnum.CONFIG]: schemas.ConfigSchema,
  [mapping.GenerableEnum.REUSABLE_COMMAND]:
    schemas.command.reusable.ReusableCommandSchema,
  [mapping.GenerableEnum.REUSED_COMMAND]:
    schemas.command.reusable.ReusedCommandSchema,
  [mapping.GenerableEnum.RESTORE]: schemas.command.cache.RestoreSchema,
  [mapping.GenerableEnum.SAVE]: schemas.command.cache.SaveSchema,
  [mapping.GenerableEnum.ATTACH]:
    schemas.command.workspace.AttachWorkspaceSchema,
  [mapping.GenerableEnum.PERSIST]: schemas.command.workspace.PersistSchema,
  [mapping.GenerableEnum.ADD_SSH_KEYS]: schemas.command.AddSSHKeysSchema,
  [mapping.GenerableEnum.CHECKOUT]: schemas.command.CheckoutSchema,
  [mapping.GenerableEnum.RUN]: schemas.command.RunSchema,
  [mapping.GenerableEnum.SETUP_REMOTE_DOCKER]:
    schemas.command.SetupRemoteDockerSchema,
  [mapping.GenerableEnum.STORE_ARTIFACTS]: schemas.command.StoreArtifactsSchema,
  [mapping.GenerableEnum.STORE_TEST_RESULTS]:
    schemas.command.StoreTestResultsSchema,

  [mapping.GenerableEnum.ANY_EXECUTOR]: schemas.executor.ExecutorSchema,
  [mapping.GenerableEnum.DOCKER_EXECUTOR]:
    schemas.executor.DockerExecutableSchema,
  [mapping.GenerableEnum.MACHINE_EXECUTOR]:
    schemas.executor.MachineExecutableSchema,
  [mapping.GenerableEnum.MACOS_EXECUTOR]:
    schemas.executor.MacOSExecutableSchema,
  [mapping.GenerableEnum.WINDOWS_EXECUTOR]:
    schemas.executor.WindowsExecutableSchema,
  [mapping.GenerableEnum.REUSABLE_EXECUTOR]:
    schemas.executor.reusable.ReusableExecutorSchema,
  [mapping.GenerableEnum.REUSABLE_EXECUTOR_LIST]:
    schemas.executor.reusable.ReusableExecutorsListSchema,
  [mapping.GenerableEnum.REUSED_EXECUTOR]:
    schemas.executor.reusable.ReusableExecutorUsageSchema,

  [mapping.GenerableEnum.STEP]: schemas.command.steps.StepSchema,
  [mapping.GenerableEnum.STEP_LIST]: schemas.command.steps.StepsSchema,
  [mapping.GenerableEnum.JOB]: schemas.JobSchema,
  [mapping.GenerableEnum.WORKFLOW_JOB]: schemas.workflow.WorkflowJobSchema,
  [mapping.GenerableEnum.WORKFLOW]: schemas.workflow.WorkflowSchema,

  [mapping.GenerableEnum.CUSTOM_PARAMETER]: {
    /* Custom Parameter Config Components */
    [mapping.ParameterizedComponentEnum.JOB]:
      schemas.parameter.JobParametersSchema,
    [mapping.ParameterizedComponentEnum.COMMAND]:
      schemas.parameter.CommandParametersSchema,
    [mapping.ParameterizedComponentEnum.EXECUTOR]:
      schemas.parameter.ExecutorParametersSchema,
    [mapping.ParameterizedComponentEnum.PIPELINE]:
      schemas.parameter.PipelineParametersSchema,
    /** Custom Parameter Generics */
    [mapping.ParameterSubEnum.STRING]:
      schemas.parameter.types.StringParameterSchema,
    [mapping.ParameterSubEnum.BOOLEAN]:
      schemas.parameter.types.BooleanParameterSchema,
    [mapping.ParameterSubEnum.INTEGER]:
      schemas.parameter.types.IntegerParameterSchema,
    [mapping.ParameterSubEnum.EXECUTOR]:
      schemas.parameter.types.ExecutorParameterSchema,
    [mapping.ParameterSubEnum.STEPS]:
      schemas.parameter.types.StepsParameterSchema,
    [mapping.ParameterSubEnum.ENV_VAR_NAME]:
      schemas.parameter.types.EnvVarNameParameterSchema,
  },
  [mapping.GenerableEnum.CUSTOM_ENUM_PARAMETER]:
    schemas.parameter.types.EnumParameterSchema,
  [mapping.GenerableEnum.CUSTOM_PARAMETERS_LIST]: {
    [mapping.ParameterizedComponentEnum.JOB]:
      schemas.parameter.lists.JobParameterListSchema,
    [mapping.ParameterizedComponentEnum.COMMAND]:
      schemas.parameter.lists.CommandParameterListSchema,
    [mapping.ParameterizedComponentEnum.EXECUTOR]:
      schemas.parameter.lists.ExecutorParameterListSchema,
    [mapping.ParameterizedComponentEnum.PIPELINE]:
      schemas.parameter.lists.PipelineParameterListSchema,
  },

  [mapping.GenerableEnum.WHEN]: schemas.logic.ConditionsSchema,
  [mapping.GenerableEnum.AND]: schemas.logic.AndConditionSchema,
  [mapping.GenerableEnum.NOT]: schemas.logic.NotConditionSchema,
  [mapping.GenerableEnum.OR]: schemas.logic.OrConditionSchema,
  [mapping.GenerableEnum.EQUAL]: schemas.logic.EqualConditionSchema,
  [mapping.GenerableEnum.TRUTHY]: schemas.logic.TruthyConditionSchema,
  [mapping.GenerableEnum.PARAMETER_REFERENCE]: {},
};

/**
 * An Ajv object that can validate a config and it's components
 * Does not handle validation of parameter usage.
 */
export class Validator extends Ajv {
  private static instance: Validator;

  public static validateOnParse: boolean;

  private constructor() {
    super({ allowUnionTypes: true, strict: false });

    Object.values(schemaRegistry).forEach((source) => {
      if ('$id' in source) {
        const schema = source as SchemaObject;
        this.addSchema(schema, schema.$id);
      } else {
        Object.values(source).forEach((schema) => {
          this.addSchema(schema, schema.$id);
        });
      }
    });
  }

  /**
   * Access a generic singleton instance of the ConfigValidator
   * Useful if validating components without a Config object
   * Use the config's validator if Config has parameterized components.
   * @returns generic instance of ConfigValidator
   */

  static getInstance(): Validator {
    if (!Validator.instance) {
      Validator.instance = new Validator();
    }

    return Validator.instance;
  }

  /**
   * Validate an unknown generable config object
   * @param generable - The class name of a generable config component
   * @param subtype - The subtype of the config component - Required for CustomParameter
   * @returns
   */
  static validateGenerable(
    generable: mapping.GenerableEnum,
    input: unknown,
    subtype?: types.config.mapping.GenerableSubtypes
  ): ValidationResult {
    const schemaSource = schemaRegistry[generable];

    if ('$id' in schemaSource) {
      const schema = schemaSource as SchemaObject;

      return Validator.getInstance().validateComponent(schema, input || null);
    } else if (subtype !== undefined && subtype in schemaSource) {
      const schema = schemaSource[subtype] as ValidationMap;

      return Validator.getInstance().validateComponent(schema, input || null);
    } else {
      throw new Error(`No validator found for ${generable}:${subtype}`);
    }
  }

  validateComponent(schema: SchemaObject, data: unknown): ValidationResult {
    const valid = super.validate(schema, data);

    if (!valid && Array.isArray(this.errors) && data) {
      return { schema, data, errors: this.errors as ErrorObject[] };
    }

    return valid;
  }
}
