#
# Dockerfile for running node applications as part of the GMS project
#

# Start with the GMS node base image
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/typescript:${DOCKER_IMAGE_TAG}

# Create user and group for node.
RUN groupadd --gid 1000 node && \
    useradd --uid 1000 --gid node --shell /bin/bash --create-home node

# Copy in the application and fix permissions.
COPY ./resources /app/resources
COPY ./dist /app
COPY ./config/ /app/config/

# Copy over the required external dependencies
COPY ./node_modules/ /app/node_modules/

RUN chown -R node:root /app && \
    chmod -R g+w /app

# Set new default user, group and working directory.
USER node:root
WORKDIR /app

# Create a volume for the externally-mounted waveform binary test data files
VOLUME /opt/app-root/src/Test_Data_Sets

# Expose the GraphQL (3000) websockets (4000) ports
EXPOSE 3000 4000

ARG CI_COMMIT_REF_NAME=NA
ARG CI_COMMIT_SHA=NA

ENV CI_COMMIT_REF_NAME=${CI_COMMIT_REF_NAME} \
    CI_COMMIT_SHA=${CI_COMMIT_SHA}

# Set the default container startup command.
ENTRYPOINT [ "node", "--max-old-space-size=8142"]

# Default command runs the SOH
CMD ["./api-soh-gateway.js" ]

# Change args or CMD to the following for ian: 
#CMD ["./api-ian-gateway.js" ]

HEALTHCHECK --interval=30s --retries=10 \
 CMD curl -f localhost:3000/alive || exit 1
