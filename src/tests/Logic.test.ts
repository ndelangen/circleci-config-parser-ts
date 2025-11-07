import { logic, mapping } from '@ndelangen/circleci-config-sdk';
import { parseLogic } from '../lib/Components/Logic';
import * as ConfigParser from '..';
import { describe, it, expect } from 'vitest';

describe('Should validate conditions', () => {
  it('Validate And condition', () => {
    expect(
      ConfigParser.Validator.validateGenerable(mapping.GenerableEnum.AND, [
        { equal: 'value' },
      ])
    ).toEqual(true);
  });
});

describe('Should parse conditions', () => {
  // TODO: verify whether equal can be singular
  it('Parse Equal single condition', () => {
    expect(parseLogic({ equal: 'value' })).toEqual(logic.equal('value'));
  });

  it('Parse Equal multiple conditions', () => {
    expect(parseLogic({ equal: ['a', 'b'] })).toEqual(logic.equal('a', 'b'));
  });

  it('Parse And condition', () => {
    expect(parseLogic({ and: [{ equal: 'value' }, { not: 'c' }] })).toEqual(
      logic.and(logic.equal('value'), logic.not('c'))
    );
  });

  it('Parse Not condition with nested condition', () => {
    expect(parseLogic({ not: { equal: ['a', 'b'] } })).toEqual(
      logic.not(logic.equal('a', 'b'))
    );
  });

  it('Parse Not condition with truthy value', () => {
    expect(parseLogic({ not: 'a' })).toEqual(logic.not('a'));
  });

  it('Parse Or condition', () => {
    expect(parseLogic({ or: [{ equal: ['a', 'b'] }, { not: 'c' }] })).toEqual(
      logic.or(logic.equal('a', 'b'), logic.not('c'))
    );
  });
});
