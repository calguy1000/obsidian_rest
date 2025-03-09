.PHONY: start stop run rebuild shell genkey
CONTAINER=obsidian_rest

server app:
	# run a container and automatically start the server
	docker exec -it ${CONTAINER} npm run start

debug-server:
	docker exec -it -e DEBUG=* ${CONTAINER} npm run start

tests:
	# run the tests
	-mkdir test_vault && touch test_vault/empty.md
	docker exec -it ${CONTAINER} npm run test 
	rm -rf test_vault

start:
	# start the services...
	docker compose up -d

genkey:
	# generate a key and save it to .env file
	_key=$(shell openssl rand -base64 32); echo API_KEY=$$_key > .env

setup: genkey
	# setup the project
	mkdir private && touch private/empty.md

down stop:
	# stop the services...
	docker compose down

rebuild: down
	docker compose up --build --force-recreate

shell: start
    # open a shell in the container
	docker exec -it --tty ${CONTAINER} bash

help:
    # show this help
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  server|app - run the service automatically start the rest server"
	@echo "  tests      - run the tests"
	@echo "  start      - start the services"
	@echo "  stop|down  - stop the services"
	@echo "  rebuild    - rebuild the services"
	@echo "  shell      - open a shell in the container"
	@echo "  genkey     - generate a key and save it to .env file"
	@echo "  setup      - setup the project"
	@echo "  help       - show this help"
	@echo ""
	@echo "Note: You can run 'make start' and 'make stop' to start and stop the services"
    
