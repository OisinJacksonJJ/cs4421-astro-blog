#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import {
  EcsServiceStack,
  ExistingBucketDeploymentStack,
  StaticSiteStack,
} from '../lib/cdk-stack';

const app = new cdk.App();
const env = { account: '098689768734', region: 'us-east-1' };

new StaticSiteStack(app, 'CdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env,

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

const imageTag = app.node.tryGetContext('imageTag') ?? 'v1.0.0';
if (typeof imageTag !== 'string' || imageTag.length === 0) {
  throw new Error('The imageTag CDK context value must be a non-empty string.');
}

new EcsServiceStack(app, 'AstroBlogEcsStack', imageTag, { env });

const siteBucketName = app.node.tryGetContext('siteBucketName');
if (typeof siteBucketName === 'string' && siteBucketName.length > 0) {
  new ExistingBucketDeploymentStack(
    app,
    'ExistingBucketDeploymentStack',
    siteBucketName,
    { env },
  );
}
