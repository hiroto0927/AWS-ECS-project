export type TPropsCpu = 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
export type TPropsMemoryLimitMiB =
  | 512
  | 1024
  | 2048
  | 4096
  | 8192
  | 16384
  | 32768
  | 65536;

export type TPropsDeployMode =
  | {
      type: "singleApplication";
      port: number;
      healthCheckPath: string;
      defaultRepoName: string;
      cpu?: TPropsCpu;
      memoryLimitMiB?: TPropsMemoryLimitMiB;
    }
  | {
      type: "frontAndBack";
      frontendPort: number;
      frontendHealthCheckPath: string;
      frontendCpu?: TPropsCpu;
      frontendMemoryLimitMiB?: TPropsMemoryLimitMiB;
      defaultFrontRepoName: string;
      backendPort: number;
      backendHealthCheckPath: string;
      backendCpu?: TPropsCpu;
      backendMemoryLimitMiB?: TPropsMemoryLimitMiB;
      defaultBackRepoName: string;
    };

export type TPropsParameters = {
  projectName: string;
  deployMode: TPropsDeployMode;
};
