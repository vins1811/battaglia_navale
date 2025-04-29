# Stage 1: Costruzione dell'applicazione
FROM node:23-slim AS builder

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione e installa le dipendenze
COPY package*.json ./
RUN npm install

# Copia il resto del codice sorgente (compreso il codice TypeScript)
COPY . .

# Esegui la build dell'applicazione
RUN npm run build  # Next.js gestirà automaticamente la compilazione TypeScript durante la build


# Stage 2: Immagine di produzione
FROM node:23-slim

# Imposta la directory di lavoro
WORKDIR /app

# Definisce la variabile d'ambiente per la produzione
ENV NODE_ENV=production

# Copia i file di package per installare solo le dipendenze di produzione
COPY package*.json ./
RUN npm install --only=production

# Copia la build e le risorse statiche dalla fase di build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Se non hai un `next.config.js`, rimuovi questa riga
# COPY --from=builder /app/next.config.js ./

# Espone la porta su cui gira l'app (default per Next.js è la 3000)
EXPOSE 3000

# Avvia l'applicazione in modalità produzione
CMD ["npm", "run", "start"]
