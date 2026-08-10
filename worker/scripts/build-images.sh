#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "Building python image..."
docker build -t talentforge-runner-python -f images/python/Dockerfile.python images/python

echo "Building node image..."
docker build -t talentforge-runner-node -f images/node/Dockerfile.node images/node

echo "Building java image..."
docker build -t talentforge-runner-java -f images/java/Dockerfile.java images/java

echo "All images built successfully."
