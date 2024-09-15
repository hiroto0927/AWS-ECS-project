import * as ecr from "aws-cdk-lib/aws-ecr";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";
import * as ecrdeploy from "cdk-ecr-deployment";

export function createEcrRepository(
  scope: Construct,
  name: string
): ecr.Repository {
  return new ecr.Repository(scope, name, {
    repositoryName: name,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        maxImageCount: 3,
      },
    ],
  });
}

export function dockerImagePushForEcr(
  scope: Construct,
  name: string,
  repository: ecr.Repository,
  dirPath: string
): void {
  const dockerImage = new DockerImageAsset(scope, name, {
    directory: path.join(__dirname, dirPath),
    platform: Platform.LINUX_AMD64,
  });

  new ecrdeploy.ECRDeployment(scope, `${name}-deploy`, {
    src: new ecrdeploy.DockerImageName(dockerImage.imageUri),
    dest: new ecrdeploy.DockerImageName(repository.repositoryUri),
  });
}
