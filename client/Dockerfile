# ---- Dingana 1 : build ny appli React (Vite) ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Ireto variables ireto dia asaina amin'ny fotoana build (docker build --build-arg ...
# na ao amin'ny docker-compose.yml), satria Vite dia "compile" azy ireo mivantana
# ao anaty JS rehefa "npm run build".
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_SERVER_URL=http://localhost:5000
ARG VITE_FACEBOOK_URL=https://facebook.com/logementmad.fianarantsoa
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_FACEBOOK_URL=$VITE_FACEBOOK_URL

RUN npm run build

# ---- Dingana 2 : mametraka ny résultat ao amin'ny nginx (mora sy haingana) ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
