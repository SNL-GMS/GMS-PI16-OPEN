ARG DOCKER_REGISTRY
ARG PROJECT_NAME
ARG DOCKER_IMAGE_TAG

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/typescript:${DOCKER_IMAGE_TAG}

# Install the app
WORKDIR /app
COPY dist/ /app
COPY mock.json /app
ENV MOCK_FILE="/app/mock.json"
ENV PORT=3000
EXPOSE 3000

# Run the app
CMD ["node", "mock-data-server.js"]
