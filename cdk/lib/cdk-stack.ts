import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('./../dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'SiteBucketName', {
      value: siteBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'SiteDistributionDomainName', {
      value: distribution.distributionDomainName,
    });
  }
}

export class ExistingBucketDeploymentStack extends cdk.Stack {
  constructor(
    scope: cdk.App,
    id: string,
    bucketName: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const siteBucket = s3.Bucket.fromBucketName(this, 'SiteBucket', bucketName);
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('./../dist')],
      destinationBucket: siteBucket,
    });
  }
}

export class EcsServiceStack extends cdk.Stack {
  constructor(
    scope: cdk.App,
    id: string,
    imageTag: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'ServiceVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });
    const repository = ecr.Repository.fromRepositoryName(
      this,
      'AstroBlogRepository',
      'astro-blog',
    );
    const cluster = new ecs.Cluster(this, 'AstroBlogCluster', { vpc });
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'AstroBlogService',
      {
        cluster,
        publicLoadBalancer: true,
        assignPublicIp: true,
        taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        desiredCount: 1,
        cpu: 256,
        memoryLimitMiB: 512,
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
        circuitBreaker: { rollback: true },
        healthCheckGracePeriod: cdk.Duration.seconds(60),
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
          containerPort: 4321,
          logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'astro-blog' }),
        },
      },
    );

    service.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyHttpCodes: '200',
    });

    new cdk.CfnOutput(this, 'ServiceUrl', {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
    });
  }
}