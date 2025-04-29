# Usa un'immagine di Python leggera
FROM python:3.11-slim

# Imposta la cartella di lavoro
WORKDIR /app

# Copia il file delle dipendenze
COPY requirements.txt .

# Installa le dipendenze
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Espone la porta 8000
EXPOSE 8000

# Avvia l'applicazione con Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]