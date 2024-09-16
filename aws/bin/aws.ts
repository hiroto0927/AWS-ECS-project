#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EcsStack } from "../lib/ecs-stack";
import { VpcStack } from "../lib/vpc-stack";
import { TPropsParameters } from "../types/parameter";

// const parameters: TPropsParameters = {
//   projectName: "sample-project",
//   deployMode: {
//     type: "frontAndBack",
//     frontendHealthCheckPath: "/api/health-check",
//     frontendPort: 3000,
//     defaultFrontRepoName: "common-nextjs",
//     backendHealthCheckPath: "/api/health-check",
//     backendPort: 8000,
//     defaultBackRepoName: "common-fastapi",
//   },
// };

const parameters: TPropsParameters = {
  projectName: "sample-project",
  deployMode: {
    type: "singleApplication",
    healthCheckPath: "/api/health-check",
    port: 8000,
    defaultRepoName: "common-fastapi",
  },
};

const app = new cdk.App();

const vpc = new VpcStack(app, `VpcForECS-${parameters.projectName}`, {
  projectName: parameters.projectName,
});

const ecs = new EcsStack(app, `EcsStack-${parameters.projectName}`, {
  projectName: parameters.projectName,
  deployMode: parameters.deployMode,
  vpc: vpc.vpc,
});
