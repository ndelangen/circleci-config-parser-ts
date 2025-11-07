import { parse } from 'yaml';
import * as CircleCI from '@ndelangen/circleci-config-sdk';
import * as ConfigParser from '../index';
import { parseGenerable, setLogParsing } from '../lib/Config/exports/Parsing';
import { describe, it, expect } from 'vitest';

describe('Parse a CircleCI Config', () => {
  const myConfig = new CircleCI.Config(true);

  myConfig.defineParameter('greeting', 'string', 'hello world');

  const configResult = myConfig.generate();
  it('Should produce a blank config with parameters', () => {
    expect(ConfigParser.parseConfig(configResult)).toEqual(myConfig);
  });

  it('Should be fully circular', () => {
    setLogParsing(true);
    expect(ConfigParser.parseConfig(parse(myConfig.stringify()))).toEqual(
      myConfig
    );
    setLogParsing(false);
  });

  it('Should be fully circular and parsable as string', () => {
    expect(ConfigParser.parseConfig(myConfig.generate())).toEqual(myConfig);
  });

  it('Should throw error when parsing returns undefined', () => {
    expect(() => {
      parseGenerable(
        CircleCI.mapping.GenerableEnum.CONFIG,
        configResult,
        () => undefined
      );
    }).toThrowError();
  });
});
