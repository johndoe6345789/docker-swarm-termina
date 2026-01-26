#!/bin/sh
sed -i "s|{{NEXT_PUBLIC_API_URL}}|${NEXT_PUBLIC_API_URL}|g" /app/public/env.js
exec "$@"
