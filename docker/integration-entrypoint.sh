#!/bin/bash
./docker/wait-for-it.sh "$DB_HOST:$DB_PORT"
npm run integration
