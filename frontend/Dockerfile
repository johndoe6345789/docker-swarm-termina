FROM node
WORKDIR /app
COPY . /app/
RUN npm i
RUN npm run build
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
