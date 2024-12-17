FROM node:18-alpine AS base
WORKDIR /app

# Copy all files for Imo
COPY . .

# Install dependencies and types for Imo
RUN npm ci --legacy-peer-deps

# Environment variables should be passed at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG OPENPIPE_API_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV OPENPIPE_API_KEY=$OPENPIPE_API_KEY

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Imo application
CMD ["npm", "start"]
