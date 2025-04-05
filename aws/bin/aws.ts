import * as cdk from "aws-cdk-lib";
import { ApplicationStack } from "../lib/application-stack";
import { NetworkStack } from "../lib/network-stack";
import { TParameters } from "../types/parameter";

const parameters: TParameters = {
  projectName: "sample", // プロジェクト名を入力
  env: "dev", // 環境名を入力
  deployMode: {
    type: "frontAndBack", // アプリケーションの構成タイプ
    frontendHealthCheckPath: "/api/health-check", // フロントエンドのヘルスチェックパス
    frontendPort: 3000, // フロントエンドのポート番号
    defaultFrontRepoName: "common-nextjs", // ECSで初回起動する際に利用するフロントエンドのリポジトリ名
    backendHealthCheckPath: "/api/health-check", // バックエンドのヘルスチェックパス
    backendPort: 8000, // バックエンドのポート番号
    defaultBackRepoName: "common-fastapi", // ECSで初回起動する際に利用するバックエンドのリポジトリ名
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
