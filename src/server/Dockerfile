FROM node:22
WORKDIR /app

COPY package*.json ./
RUN npm i -g ts-node
RUN npm i -g nodemon
RUN npm i

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]