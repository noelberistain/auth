FROM node:10.15.3-alpine as auth001
WORKDIR /auth
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "npm", "start" ]
EXPOSE 5000