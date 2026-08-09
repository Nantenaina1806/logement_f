FROM node:20-alpine

WORKDIR /app

# Mampiditra ny dependencies aloha (cache Docker mihasarotra kokoa raha misy fiovana
# amin'ny code fotsiny, tsy ny package.json).
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ny sary uploadées dia tokony ho tehirizina amin'ny volume ivelan'ny image
# (jereo docker-compose.yml : volume "uploads_data").
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]
