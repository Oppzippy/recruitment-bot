integration-test:
	docker compose -f docker/docker-compose-integration.yml up --abort-on-container-exit
	docker compose -f docker/docker-compose-integration.yml down

clean-integration-test:
	docker compose -f docker/docker-compose-integration.yml build
	just integration-test
