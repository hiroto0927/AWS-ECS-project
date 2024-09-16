FROM python:3.10.12-slim-buster

RUN pip install poetry
COPY poetry.lock pyproject.toml ./
RUN poetry install --no-root --no-dev

COPY ./app .

CMD ["poetry", "run", "streamlit", "run", "main.py",  "--browser.gatherUsageStats", "false", "--server.headless", "true", "--server.fileWatcherType", "none","--server.port", "8000", "--server.address=0.0.0.0"]