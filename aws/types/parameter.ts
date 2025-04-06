export type TCpu = 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384;
export type TMemory = 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768 | 65536;

export type TSingleApplication = {
  type: "singleApplication";
  port: number;
  healthCheckPath: string;
  defaultRepoName: string;
  cpu?: TCpu;
  memoryLimitMiB?: TMemory;
};

export type TMultipleApplication = {
  type: "frontAndBack";
  frontendPort: number;
  frontendHealthCheckPath: string;
  frontendCpu?: TCpu;
  frontendMemoryLimitMiB?: TMemory;
  defaultFrontRepoName: string;
  backendPort: number;
  backendHealthCheckPath: string;
  backendCpu?: TCpu;
  backendMemoryLimitMiB?: TMemory;
  defaultBackRepoName: string;
};

export type TDeployMode = TSingleApplication | TMultipleApplication;

export type TEnv = "dev" | "stg" | "prd";

export type TParameters = {
  projectName: string;
  env: TEnv;
  deployMode: TDeployMode;
};
