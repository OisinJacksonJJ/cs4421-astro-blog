# AWS CDK infrastructure

This project contains the legacy static-site deployment stacks. They target
AWS account `098689768734` in `us-east-1`. CI builds and synthesizes the stacks
but does not deploy them or create AWS resources.

The CDK app packages the Astro build as a static-site asset, so build the site
from the repository root before synthesizing:

```sh
cd ..
npm ci
npm run build
cd cdk
npm ci
```

## Useful commands

* `npm run build`   type-check the CDK project
* `npm test`        run CDK template assertions
* `npx cdk synth`   synthesize all CDK stacks without deploying
The `npx cdk synth` and CI validation commands do not require AWS credentials
and do not create billable AWS resources. Deploying the legacy stacks is not
part of CI.
