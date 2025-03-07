.PHONY: start stop run rebuild shell

up start:
	docker compose up -d

down stop:
	docker compose down

rebuild:
	docker compose up --build --force-recreate

shell: start
	docker exec -it --tty my-express-app bash