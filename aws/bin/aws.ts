import * as cdk from "aws-cdk-lib";
import { ApplicationStack } from "../lib/application-stack";
import { NetworkStack } from "../lib/network-stack";
import { TParameters } from "../types/parameter";
import { toPascalCase } from "../lib/utils/string";

const parameters: TParameters = {
  projectName: "sample-project", // プロジェクト名を入力
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

const accountId = process.env.ACCOUNT_ID;
const region = process.env.REGION;
const name = toPascalCase(`${parameters.projectName}-${parameters.env}`);

const network = new NetworkStack(app, `${name}NetworkStack`, {
  config: parameters,
  env: {
    account: accountId,
    region: region,
  },
});

new ApplicationStack(app, `${name}ApplicationStack`, {
  config: parameters,
  vpc: network.vpc,
  env: {
    account: accountId,
    region: region,
  },
});
