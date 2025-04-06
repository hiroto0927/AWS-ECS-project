# 概要

ECS でアプリケーションを動かすためのお試しのテンプレートプロジェクトです。

※本番稼働を想定していません。  
※自分用に作成。

# 想定読者

- ECS を試しで使ってみたい方
- コンテナを理解している方

# 環境

- AWS
- CDK(2.158.0)
- NodeJS(v20.19.0)

# インフラ構成

あとで記載。。。

# デプロイ準備

## ECR の設定

Amazon ECR に ECS で初回デプロイするためのリポジトリとイメージを用意してください。  
※ フロントエンドとバックエンドの構成の場合は 2 つ必要です。

1. ECR の作成
   ECR の作成方法については、下記リンクを参照すること。  
   [イメージを保存するための Amazon ECR プライベートリポジトリの作成](https://docs.aws.amazon.com/ja_jp/AmazonECR/latest/userguide/repository-create.html)
2. 1 で作成したリポジトリに ECS で初回起動するコンテナイメージを push してください。

## デプロイ方法

1. `aws`フォルダに移動。
2. `aws/bin/aws`ファイルの`parameters`を編集してください。

**フロントエンドとバックエンドの構成**

```ts
const parameters: TParameters = {
  projectName: "sample-project", // プロジェクト名を入力
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
```

**単一アプリケーションの構成**

```ts
const parameters: TParameters = {
  projectName: "sample-project",
  env: "dev",
  deployMode: {
    type: "singleApplication", // アプリケーションの構成タイプ
    healthCheckPath: "/api/health-check", // アプリケーションのヘルスチェックパス
    port: 8000, // アプリケーションのポート番号
    defaultRepoName: "common-fastapi", // ECSで初回起動する際に利用するバックエンドのリポジトリ名
  },
};
```

3. `cdk diff`コマンドを実行。差分チェックとエラーが出ないこと確認してください。
4. `npm run deploy`実行し、インフラをデプロイ。
5. デプロイ完了。

# アプリケーションの更新方法

1. 新しいアプリケーションのコンテナイメージを作成
2. ECR に 1 で作成したコンテナイメージを push する。
3. ECS 側の更新が自動で開始し、アプリケーションが新しいバージョンに更新される。(現状、ローリングアップデートのみ対応)

# 削除方法

1. `aws`フォルダに移動
2. `npm run destroy --all`を実行する。
3. リソースの削除完了。
