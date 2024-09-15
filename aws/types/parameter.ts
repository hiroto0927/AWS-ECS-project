export type TPropsDeployMode =
  | {
      type: "singleApplication";
      port: number;
      healthCheckPath: string;
    }
  | {
      type: "frontAndBack";
      frontendPort: number;
      frontendHealthCheckPath: string;
      backendPort: number;
      backendHealthCheckPath: string;
    };

export type TPropsParameters = {
  projectName: string;
  deployMode: TPropsDeployMode;
};
