network:
	docker network create rumahamal-network

db:
	docker compose --env-file ./.env.docker up --build rumahamal-db

# For local migration, not in container
prisma-migrate:
	npx dotenv -e .env.local prisma migrate dev 

# For local generate, not in container
prisma-generate:
	npx dotenv -e .env.local prisma generate

stop:
	docker compose down -v

test:
	npm test