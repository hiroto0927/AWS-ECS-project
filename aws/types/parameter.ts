export type TPropsDeployMode =
  | {
      type: "singleApplication";
      port: number;
      healthCheckPath: string;
      deployAppFolderName: string;
    }
  | {
      type: "frontAndBack";
      frontendPort: number;
      frontendHealthCheckPath: string;
      deployFrontAppFolderName: string;
      backendPort: number;
      backendHealthCheckPath: string;
      deployBackAppFolderName: string;
    };

export type TPropsParameters = {
  projectName: string;
  deployMode: TPropsDeployMode;
};
