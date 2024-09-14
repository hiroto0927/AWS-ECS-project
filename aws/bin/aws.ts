#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EcsStack } from "../lib/ecs-stack";
import { EcsContainerRoleStack } from "../lib/ecs-container-role";
import { VpcStack } from "../lib/vpc-stack";

const app = new cdk.App();
new EcsStack(app, "EcsStack", {});
new VpcStack(app, "VpcStack", {});
new EcsContainerRoleStack(app, "EcsContainerRoleStack", {});
