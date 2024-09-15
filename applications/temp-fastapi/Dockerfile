FROM python:3.10.12-slim-buster

RUN pip install poetry
COPY poetry.lock pyproject.toml ./
RUN poetry install --no-root --no-dev

COPY ./app .

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]