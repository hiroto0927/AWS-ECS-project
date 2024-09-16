import os


SERVICE_NAME = os.getenv("SERVICE_NAME")
TASK_ROLE_ARN = os.getenv("TASK_ROLE_ARN")
TASK_EXEC_ROLE_ARN = os.getenv("TASK_EXEC_ROLE_ARN")
MEMORY = int(os.getenv("MEMORY"))
CPU = int(os.getenv("CPU"))
CLUSTER_ARN = os.getenv("CLUSTER_ARN")
SERVICE_ARN = os.getenv("SERVICE_ARN")
PORT = int(os.getenv("PORT"))
FAMILY = os.getenv("FAMILY")
