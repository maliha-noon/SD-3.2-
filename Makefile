# ============================================================
# AURA++ — Makefile
# Convenient shortcuts for Docker and development tasks
# ============================================================

IMAGE_NAME  := aura-app
REGISTRY    := ghcr.io
TAG         ?= latest
COMPOSE     := docker compose
DOTNET      := dotnet

.PHONY: help build run stop logs shell push clean dev test

## ── Help ────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  AURA++ Docker Makefile"
	@echo "  ─────────────────────────────────────"
	@echo "  make dev         Run app locally (dotnet watch)"
	@echo "  make build       Build Docker image"
	@echo "  make run         Start containers (SQLite)"
	@echo "  make run-mysql   Start containers (MySQL)"
	@echo "  make stop        Stop and remove containers"
	@echo "  make logs        Tail container logs"
	@echo "  make shell       Open shell inside container"
	@echo "  make push        Push image to registry"
	@echo "  make clean       Remove all containers and images"
	@echo "  make test        Run dotnet tests"
	@echo ""

## ── Local development (no Docker) ──────────────────────────
dev:
	$(DOTNET) watch run --project AuraApp.csproj

## ── Run tests ───────────────────────────────────────────────
test:
	$(DOTNET) test --configuration Release --logger "console;verbosity=normal"

## ── Docker build ────────────────────────────────────────────
build:
	docker build \
		-t $(IMAGE_NAME):$(TAG) \
		--build-arg BUILD_CONFIGURATION=Release \
		--progress=plain \
		.

## ── Start containers (SQLite — default profile) ─────────────
run:
	$(COMPOSE) --profile default up -d --build
	@echo "✅ App running at http://localhost:5000"

## ── Start containers (MySQL profile) ───────────────────────
run-mysql:
	$(COMPOSE) --profile mysql up -d --build
	@echo "✅ App (MySQL) running at http://localhost:5000"
	@echo "   Adminer DB GUI at http://localhost:8888"

## ── Stop all containers ─────────────────────────────────────
stop:
	$(COMPOSE) down

## ── Stream logs ─────────────────────────────────────────────
logs:
	$(COMPOSE) logs -f

## ── Open shell in running app container ─────────────────────
shell:
	docker exec -it aura_app /bin/bash || docker exec -it aura_app /bin/sh

## ── Push image to GHCR ──────────────────────────────────────
push: build
	docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)

## ── Clean everything ────────────────────────────────────────
clean:
	$(COMPOSE) down -v --rmi all --remove-orphans
	docker system prune -f
	@echo "🧹 All cleaned up."
