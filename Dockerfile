FROM node:16.17.0-alpine
WORKDIR /usr/src/app
COPY . ./
RUN yarn install && yarn build
EXPOSE 3004
EXPOSE 3003
CMD ["yarn","dev"]