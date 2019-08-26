FROM node:carbon AS build

ARG SSH_PRIVATE_KEY
RUN mkdir -p ~/.ssh
RUN echo "${SSH_PRIVATE_KEY}" > ~/.ssh/id_rsa
RUN chmod 600 ~/.ssh/id_rsa

RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts

WORKDIR /app
ADD package.json .
ADD package-lock.json .
ADD src ./src
ADD index.js .
RUN npm install --only=production

FROM node:carbon-alpine

WORKDIR /app
COPY --from=build /app .

CMD [ "node", "./index.js" ]
