integration-test:
	docker compose -f docker/docker-compose-integration.yml up --abort-on-container-exit

clean-integration-test:
	docker compose -f docker/docker-compose-integration.yml build
	docker compose -f docker/docker-compose-integration.yml up --abort-on-container-exit
