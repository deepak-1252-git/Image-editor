# Python image use karein
FROM python:3.11-slim

# System dependencies (Poppler) install karein
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# App directory banayein
WORKDIR /app

# Sabse pehle requirements copy aur install karein
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baaki sara code copy karein
COPY . .

# App run karne ki command (Port 10000 use karein)
CMD ["gunicorn", "main:app", "--bind", "0.0.0.0:10000"]