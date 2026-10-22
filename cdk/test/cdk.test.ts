import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { EcsServiceStack, StaticSiteStack } from '../lib/cdk-stack';

test('creates an S3 bucket and CloudFront distribution with origin access control', () => {
  const app = new cdk.App();
  const stack = new StaticSiteStack(app, 'TestStaticSite');
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::S3::Bucket', 1);
  template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  template.hasResourceProperties('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      DefaultRootObject: 'index.html',
    },
  });
});

test('creates an ECS Fargate service using the ECR image and health check path', () => {
  const app = new cdk.App();
  const stack = new EcsServiceStack(app, 'TestEcsService', 'v1.0.0');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    Cpu: '256',
    Memory: '512',
    RequiresCompatibilities: ['FARGATE'],
    ContainerDefinitions: Match.arrayWith([
      Match.objectLike({
        Image: {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('/astro-blog:v1\\.0\\.0$')]),
          ]),
        },
        PortMappings: Match.arrayWith([
          Match.objectLike({ ContainerPort: 4321, Protocol: 'tcp' }),
        ]),
      }),
    ]),
  });
  template.hasResourceProperties('AWS::ECS::Service', {
    DesiredCount: 1,
    LaunchType: 'FARGATE',
    HealthCheckGracePeriodSeconds: 60,
    LoadBalancers: Match.arrayWith([
      Match.objectLike({ ContainerPort: 4321 }),
    ]),
  });
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
    HealthCheckPath: '/api/health',
    Matcher: { HttpCode: '200' },
  });
});
