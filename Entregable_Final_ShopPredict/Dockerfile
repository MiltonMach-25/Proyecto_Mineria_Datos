FROM node:24-slim AS frontend-build

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SHOPPREDICT_DATASET=/app/data/online_shoppers_intention.csv

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY data/ /app/data/
COPY assets/ /app/assets/
COPY index.html dashboard.html /app/
COPY --from=frontend-build /build/frontend/dist/ /app/frontend/dist/

EXPOSE 8080
CMD ["sh", "-c", "uvicorn backend.api_shoppredict:app --host 0.0.0.0 --port ${PORT:-8080}"]
