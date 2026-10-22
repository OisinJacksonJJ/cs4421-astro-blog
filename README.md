# What's in a Kickout?

What's in a Kickout? is an Astro-powered wrestling blog. It uses Astro's Node.js
standalone adapter to run as a server-rendered application, with article content
managed in the repository.

## Prerequisites

For local development, install:

- [Node.js](https://nodejs.org/) 22.12.0 or newer.
- npm, which is included with Node.js.
- Git, to clone the repository.

No environment variables, AWS account, or external services are required to run
the site locally. AWS access is required to publish the production container
image or to provision or deploy the ECS service.

Docker is optional and is only needed to build and run the production container.
AWS credentials are only needed by GitHub Actions to publish the container
image to Amazon ECR when changes are pushed to `main`.

## Getting started

Clone the repository, install the locked dependencies, and start the development
server:

```sh
git clone https://github.com/OisinJacksonJJ/cs4421-astro-blog.git
cd cs4421-astro-blog
npm ci
npm run dev
```

Open the local URL printed by Astro (by default, <http://localhost:4321>). The
development server reloads the site as files change.

## Common commands

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run check` | Run Astro's project and TypeScript checks. |
| `npm run lint` | Run ESLint. |
| `npm run test:unit -- --run` | Run the unit tests once. |
| `npm run test:e2e` | Build and verify that stories link to every blog post. |
| `npm run build` | Build the production server into `dist/`. |
| `npm run preview` | Preview the built site locally. |
| `node ./dist/server/entry.mjs` | Run the built standalone Node.js server. |

Pull requests targeting `main` and pushes to `main` run the CI workflow. It
checks and tests the Astro site, runs end-to-end tests, and builds, tests, and
synthesizes the AWS CDK project. The separate **Deploy Container to AWS**
workflow runs on pushes to `main`: it runs the unit tests, builds the container,
publishes it to the `astro-blog` repository in Amazon ECR in `us-east-1` tagged
with the commit SHA, then updates the ECS Fargate service to that image. Pull
requests do not publish images or deploy the service.

The deploy workflow requires the AWS credentials secrets used by CI and
permissions to update the CDK-managed ECS, load balancer, networking, and
related CloudFormation resources. The CDK environment must be bootstrapped once
before its first deployment. Deploying the service creates billable AWS
resources.

The unit tests check that each Markdown blog post contains at least 50
alphabetic words in its article body, excluding frontmatter. The E2E test
builds the site, starts the standalone server, checks that each post is listed
on `/blog/`, and requests each linked post page to verify that its title is
rendered. Run the unit tests and E2E test separately with the commands above.

To run the production server locally, build first:

```sh
npm run build
node ./dist/server/entry.mjs
```

The server uses port `4321` by default. The health and performance endpoints are:

- `GET /api/health` — overall process health, including uptime.
- `GET /api/live` — liveness check.
- `GET /api/ready` — readiness check.
- `GET /api/metrics` — uncached Node.js process metrics for uptime, memory
  (bytes), CPU time (microseconds), and event-loop utilization (0–1). These
  process-wide counters support local and production performance checks; they
  are snapshots, not request-latency histograms.

The server writes one JSON object per line to standard output for each HTTP
request. Records include an ISO timestamp, a level (`info`, `warn`, or `error`),
the request method and path, response status, and duration. Unhandled request
exceptions also produce a `fatal` JSON record with error details. Clicks on
links/buttons and form submissions produce `action` records through
`POST /api/logs/action`; only the action type, page path, and element type are
recorded, not form contents or visible text. Invalid requests receive warning
request records, and HTTP 5xx responses receive error-level request records.

## Project layout

```text
src/
  components/   Shared Astro components
  content/      Blog posts, authors, and sidebar content
  layouts/      Page and blog post layouts
  pages/        Site routes and API endpoints
  styles/       Global styles
public/         Static files served without processing
docs/           Architecture decisions
cdk/            Legacy AWS CDK static-site infrastructure
```

Add or edit blog content under `src/content/`. Pages and API routes live under
`src/pages/`; Astro maps files in this directory to URL routes.

## Production container

The root `Dockerfile` builds the Astro server and runs it in a Node.js 22 Alpine
container. With Docker installed, build and run the image with:

```sh
docker build -t whats-in-a-kickout .
docker run --rm -p 4321:4321 whats-in-a-kickout
```

The container listens on port `4321` and checks `/api/health` for its Docker
health check.

ECR stores an image for each successful push to `main`; storage may incur
charges. The static-site CDK deployment workflow remains manual and
deliberately stops because the application builds as SSR.

The legacy S3/CloudFront stack and **Deploy Static Site via AWS CDK** workflow
are a static-site deployment path. The application now produces server output,
so that workflow deliberately stops rather than deploying the SSR build to S3.

## Further documentation

- [Astro documentation](https://docs.astro.build/)
- [Architecture decision: SSR and containers](docs/adr/ADR-001-transition-to-ssr-and-containers.md)
