FROM python:3.14-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_SYSTEM_PYTHON=1

COPY pyproject.toml ./

RUN uv pip install fastapi uvicorn[standard] python-socketio python-multipart

COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:socket_app", "--host", "0.0.0.0", "--port", "8000"]
