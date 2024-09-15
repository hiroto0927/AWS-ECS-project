export type TPropsDeployMode =
  | {
      type: "singleApplication";
      port: number;
      healthCheckPath: string;
      defaultRepoName: string;
    }
  | {
      type: "frontAndBack";
      frontendPort: number;
      frontendHealthCheckPath: string;
      defaultFrontRepoName: string;
      backendPort: number;
      backendHealthCheckPath: string;
      defaultBackRepoName: string;
    };

export type TPropsParameters = {
  projectName: string;
  deployMode: TPropsDeployMode;
};
