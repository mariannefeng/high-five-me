#!/bin/bash

set -e  # Exit on error

# Configuration
# For GHCR: REGISTRY_URL=ghcr.io IMAGE_NAME=owner/high-five-me-backend
# For local: REGISTRY_URL=localhost:5000 IMAGE_NAME=high-five-me-backend
REGISTRY_URL="${REGISTRY_URL:-localhost:5000}"
IMAGE_NAME="${IMAGE_NAME:-high-five-me-backend}"
VERSION="${VERSION:-latest}"

# Build full image tag
# Handle both formats: registry/image:tag and registry/owner/image:tag
if [[ "${IMAGE_NAME}" == *"/"* ]]; then
  # Image name already includes owner (e.g., owner/image-name)
  IMAGE_TAG="${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
else
  # Image name is just the name (e.g., image-name)
  IMAGE_TAG="${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
fi

echo "Building Docker image: ${IMAGE_TAG}"

# Build the image
docker build -t "${IMAGE_TAG}" .

# Optionally tag as latest if VERSION is not 'latest'
if [ "${VERSION}" != "latest" ]; then
  if [[ "${IMAGE_NAME}" == *"/"* ]]; then
    LATEST_TAG="${REGISTRY_URL}/${IMAGE_NAME}:latest"
  else
    LATEST_TAG="${REGISTRY_URL}/${IMAGE_NAME}:latest"
  fi
  docker tag "${IMAGE_TAG}" "${LATEST_TAG}"
  echo "Tagged as: ${LATEST_TAG}"
fi

echo "Pushing image to registry: ${IMAGE_TAG}"

# Push the image
docker push "${IMAGE_TAG}"

# Push latest tag if it was created
if [ "${VERSION}" != "latest" ]; then
  echo "Pushing latest tag: ${LATEST_TAG}"
  docker push "${LATEST_TAG}"
fi

echo "Successfully built and pushed ${IMAGE_TAG}"
