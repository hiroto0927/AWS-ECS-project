import * as cdk from "aws-cdk-lib";
import { ApplicationStack } from "../lib/application-stack";
import { NetworkStack } from "../lib/network-stack";
import { TPropsParameters } from "../types/parameter";

const parameters: TPropsParameters = {
  projectName: "sample-project",
  env: "dev",
  deployMode: {
    type: "singleApplication",
    healthCheckPath: "/api/health-check",
    port: 8000,
    defaultRepoName: "common-fastapi",
  },
};

const app = new cdk.App();

const vpc = new NetworkStack(app, `VpcForECS-${parameters.projectName}`, {
  config: parameters,
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION,
  },
});

new ApplicationStack(app, `EcsStack-${parameters.projectName}`, {
  config: parameters,
  vpc: vpc.vpc,
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION,
  },
});
