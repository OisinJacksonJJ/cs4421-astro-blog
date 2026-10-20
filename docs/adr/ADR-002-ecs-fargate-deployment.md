# ADR-002: Deploy the SSR Application on ECS/Fargate

## Status: Accepted (Date: 2026-10-20)

## Context

ADR-001 moved the Astro application to a Node.js SSR container. The existing
S3/CloudFront CDK stack cannot run that server, and publishing an image to ECR
alone does not run the application.

## Decision

- Provision a new ECS cluster and Fargate service using AWS CDK.
- Place the service behind an internet-facing Application Load Balancer, with
  the ALB health check using `/api/ready`.
- Build and publish the application container as a CDK Docker asset during
  deployment.
- Run the deployment job only after site and CDK validation pass on pushes to
  `main`.
- Use public subnets and public task IPs with no NAT gateway to avoid NAT
  gateway charges. The load balancer and Fargate service still incur AWS
  charges.

## Consequences

- Positive: CI validates the infrastructure template, and successful updates
  to `main` automatically deploy the SSR container.
- Positive: The service endpoint, cluster, and service names are available as
  CloudFormation outputs.
- Negative: Initial deployment requires CDK bootstrapping and AWS credentials
  with permissions to create and update the required networking, ECS, IAM,
  load-balancing, logging, and asset resources.
- Negative: The generated load-balancer URL uses HTTP. A custom domain and TLS
  certificate must be configured separately for HTTPS.
- The legacy static-site stack remains unchanged and is not deployed by the ECS
  deployment job.
