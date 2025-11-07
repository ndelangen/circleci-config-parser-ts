# CircleCI Config Parser

A parsing library for CircleCI configuration files, powered by the (forked)
[CircleCI Config SDK](https://github.com/ndelangen/circleci-config-sdk-ts)

## Getting Started

- [View the Parser API Docs](#)

### Installation

Using npm:

```sh
$ npm i @ndelangen/circleci-config-parser
```

#### Usage

In Node.js:

```ts
import ConfigParser from '@ndelangen/circleci-config-parser';
```

Loading a Config instance from a config file

```ts
import fs from 'node:fs';

const configSrc = fs.readFileSync('./config.yml', 'utf8');
const config = ConfigParser.parseConfig(configSrc);
```

Parsing a job config equivalent object, into a CircleCI Config SDK `Job`
instance.

```ts
const jobIn = {
  docker: [{ image: 'cimg/base:2022.08' }],
  resource_class: 'medium',
  steps: [
    {
      run: {
        command: 'echo << parameters.greeting >>',
      },
    },
  ],
  parameters: {
    greeting: {
      type: 'string',
    },
  },
};

// Parsing function
ConfigParser.parseJob('Job Name', jobIn);
```

The equivalent config-sdk instantiation for that object:

```ts
new CircleCI.reusable.ParameterizedJob(
  'my_job',
  new CircleCI.executors.DockerExecutor('cimg/node:lts'),
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('greeting', 'string'),
  ]),
  [
    new CircleCI.commands.Run({
      command: 'echo << parameters.greeting >>',
    }),
  ],
);
```

Parsing Orb references requires an OrbManifest, which is a representation of
Orbs outward facing properties.

```ts
import fs from 'node:fs';

const customOrbProps = {
  // component type
  jobs: {
    // name of component
    say_hello: {
      // component parameters
      greeting: {
        type: 'string',
      },
    },
  },
  commands: {
    say_it: {
      what: {
        type: 'string',
      },
    },
  },
  executors: {
    python: {
      version: {
        type: 'string',
        default: '1.0.0',
      },
    },
  },
};

const customOrbManifest = ConfigParser.parseOrbManifest(customOrbProps);

const configSrc = fs.readFileSync('./config.yml', 'utf8');
const config = ConfigParser.parseConfig(configSrc, {
  'custom-orb': customOrbManifest,
});
```
