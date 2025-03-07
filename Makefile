.PHONY: start stop run rebuild shell genkey
CONTAINER=obsidian_rest

server app:
    # run a container and automatically start the server
	docker compose run --rm --entrypoint "npm run start" app

start:
    # start the services...
	docker compose up -d

genkey:
    # generate a key and save it to .env file
	_key=$(shell openssl rand -base64 32); echo API_KEY=$$_key > .env

down stop:
    # stop the services...
	docker compose down

rebuild:

	docker compose up --build --force-recreate

shell: start
    # open a shell in the container
	docker exec -it --tty ${CONTAINER} bash
