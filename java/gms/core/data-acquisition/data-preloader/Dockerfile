# Run the pre-loader

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /data-preloader/

#COPY load-soh-data.sh ./data-preloader/load-soh-data.sh
COPY bin ./data-preloader/bin
COPY lib ./data-preloader/lib

RUN set -ex && \
    chgrp -R 0 /data-preloader && \
    chmod -R g=u /data-preloader && \
    chmod -R g+s /data-preloader
#    chmod +x /data-preloader/data-preloader/load-soh-data.sh

# Start the pre-loader
###PARAMETER COUNT                  $1               $2              $3                   $4            $5                 $6                      $7                   $8                             $9                   $10                            $11                   $12                             $13             $14                       $15                   $16                       $17                          $18                          $19                           $20                           $21               $22               $23                $24                              $25                          $26                          $27              $28              $29               $30                             $31
#CMD data-preloader/load-soh-data.sh ${STATION_GROUP} ${DAYS_TO_LOAD} ${DAYS_AGO_TO_START} ${LOAD_RSDFS} ${RECEPTION_DELAY} ${RSDF_SAMPLE_DURATION} ${LOAD_STATION_SOHS} ${STATION_SOH_SAMPLE_DURATION} ${LOAD_ANALOG_ACEIS} ${ACEI_ANALOG_SAMPLE_DURATION} ${LOAD_BOOLEAN_ACEIS} ${ACEI_BOOLEAN_SAMPLE_DURATION} ${LOAD_ROLLUPS} ${ROLLUP_SAMPLE_DURATION} ${DURATION_INCREMENT} ${BOOLEAN_INITIAL_STATUS} ${MEAN_OCCURRENCES_PER_YEAR} ${MEAN_HOURS_OF_PERSISTENCE} ${DURATION_ANALOG_STATUS_MIN} ${DURATION_ANALOG_STATUS_MAX} ${DURATION_BETA0} ${DURATION_BETA1} ${DURATION_STDERR} ${DURATION_ANALOG_INITIAL_VALUE} ${PERCENT_ANALOG_STATUS_MIN} ${PERCENT_ANALOG_STATUS_MAX} ${PERCENT_BETA0} ${PERCENT_BETA1} ${PERCENT_STDERR} ${PERCENT_ANALOG_INITIAL_VALUE} ${USE_CURATED_DATA_GENERATION}
