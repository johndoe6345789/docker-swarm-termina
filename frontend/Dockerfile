FROM node
WORKDIR /app
COPY * /app/
RUN npm i
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
