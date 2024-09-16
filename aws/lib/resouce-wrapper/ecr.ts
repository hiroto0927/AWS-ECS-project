import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export function createEcrRepository(
  scope: Construct,
  name: string
): ecr.Repository {
  return new ecr.Repository(scope, name, {
    repositoryName: name,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    emptyOnDelete: true,
    lifecycleRules: [
      {
        maxImageCount: 3,
      },
    ],
  });
}
