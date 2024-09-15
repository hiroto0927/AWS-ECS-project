FROM node:alpine3.20

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm","run", "start"]