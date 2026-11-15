FROM python:3.12-slim

WORKDIR /app

COPY services/api/pyproject.toml /app/pyproject.toml
COPY services/api/src /app/src
COPY apps/web/public/data /app/data

RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .

ENV TIANEDGE_DATA_DIR=/app/data
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "tianedge_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
