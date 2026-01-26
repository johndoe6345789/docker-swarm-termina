FROM node

RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm i

COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
