# AWS CDK infrastructure

This project contains the legacy static-site deployment stack and the
`ContainerServiceStack` for running the Astro SSR application on ECS/Fargate
behind an Application Load Balancer. The legacy static-site stack is pinned to
AWS account `098689768734` in `us-east-1`. The container stack uses the active
CDK deployment environment; the GitHub deployment job verifies that it targets
account `098689768734` in `us-east-1`.

The CDK app also synthesizes the legacy static-site stack, so build the Astro
site from the repository root before synthesizing or deploying:

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
* `npx cdk diff ContainerServiceStack`   compare the ECS stack with AWS
* `npx cdk deploy ContainerServiceStack --require-approval never`   deploy the ECS stack

The AWS account must be bootstrapped once before the first deployment:

```sh
npx cdk bootstrap aws://098689768734/us-east-1
```

Deploying creates billable AWS resources. See the repository README for the
GitHub Actions deployment requirements and architecture details.
