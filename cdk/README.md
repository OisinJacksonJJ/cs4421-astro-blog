# AWS CDK infrastructure

This project contains the static-site CloudFront/S3 stack and the
containerized Astro site's ECS/Fargate service. The stacks target AWS account
`098689768734` in `us-east-1`. CI builds and synthesizes the stacks but does
not deploy them or create AWS resources.

The CDK app packages the Astro static build as a site asset. To create that
build for a local deployment, set `ASTRO_STATIC_BUILD=true` when building from
the repository root:

```sh
cd ..
npm ci
ASTRO_STATIC_BUILD=true npm run build
cd cdk
npm ci
```

## Useful commands

* `npm run build`   type-check the CDK project
* `npm test`        run CDK template assertions
* `npx cdk synth`   synthesize all CDK stacks without deploying
The `npx cdk synth` and CI validation commands do not require AWS credentials
and do not create billable AWS resources. The **Deploy Static Site via AWS
CDK** workflow deploys the static stack on pushes to `main`, while **Deploy
Container to AWS** builds and pushes a commit-tagged image, then deploys the ECS
stack. Both deployments require AWS credentials configured as GitHub secrets.

`cdk.context.json` is checked in with the account's Availability Zone lookup
result so synthesis and CI do not need AWS credentials. Refresh this context
with credentials if the target account or Region changes.

## ECS service

`CdkStack` creates a private S3 bucket with CloudFront Origin Access Control,
an HTTPS CloudFront distribution, static asset deployment, and automatic cache
invalidation. A CloudFront Function maps directory routes such as `/blog/` to
their `index.html` objects. It receives the static files from `dist/client` and excludes
`api/`; it does not publish the SSR server bundle or dynamic API endpoints.

The static workflow sets `ASTRO_STATIC_BUILD=true`, so public pages such as
the homepage and blog pages are prerendered for S3. The default build remains
server output for the Docker/ECS deployment.

`AstroBlogEcsStack` creates a Fargate service that runs the `astro-blog` ECR
repository image, an internet-facing Application Load Balancer, and a target
group health check at `/api/health`. It starts one 0.25-vCPU, 512-MiB task.
Tasks use public subnets without NAT gateways and accept application traffic
only from the load balancer. The load balancer listener uses HTTP; configure
HTTPS and a domain separately before production use.

The image tag defaults to `v1.0.0` for direct CDK deployments. To deploy
another tag, pass it as CDK context. On a first deployment, bootstrap CDK if
the account and Region have not already been bootstrapped:

```sh
npx cdk bootstrap aws://098689768734/us-east-1
npx cdk deploy AstroBlogEcsStack -c imageTag=v1.0.0
```

Deployment creates billable AWS resources, including an Application Load
Balancer and running Fargate task. The stack output `ServiceUrl` is the
load-balancer address. Synthesizing or testing the stack does not deploy it.
