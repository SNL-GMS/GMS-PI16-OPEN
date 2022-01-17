package gms.testtools.mockworkflow.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.system.events.SystemEvent;
import java.io.UncheckedIOException;
import java.util.List;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KafkaPublisher {
    private static final Logger logger = LoggerFactory.getLogger(KafkaPublisher.class);
    private static KafkaPublisher instance;
    private  final Producer<String, String> producer;
    private static String topic = null;

    private KafkaPublisher(){
        logger.info("Creating KafkaProducer!");
        this.producer = this.initializeKafkaProducer();
        logger.info("Finished creating KafkaProducer!");
    }

    public static void initialize(String topicToSend) {
        topic = topicToSend;
    }

    public static KafkaPublisher getInstance() {
        if (instance == null){
            instance = new KafkaPublisher();
        }
        return instance;
    }

    /**
     * Break up the waveform to 1MB chunks and send them on the topic
     * @param messagesToSend SystemEvent messages to send
     */
    public void sendRecords(List<SystemEvent> messagesToSend){

        for (SystemEvent msg : messagesToSend) {
            try {
                var eventString = CoiObjectMapperFactory.getJsonObjectMapper()
                  .writeValueAsString(msg);
                ProducerRecord<String, String> producerRecord = new ProducerRecord<>(
                  topic, eventString
                );
                this.producer.send(producerRecord);
            } catch (JsonProcessingException ex) {
                throw new UncheckedIOException(ex);
            }
        }
    }

    private Producer<String, String> initializeKafkaProducer() {
        // from mock run producer script
        var kafkaBootstrapServer="kafka:9092";
        var kafkaRetries=10;
        var kafkaRetryDelay=1000;

        // Create Kafka Producer connection
        return KafkaProducerFactory.getProducer(
                "mock_workflow_manager_",
                kafkaBootstrapServer,
                kafkaRetries,
                kafkaRetryDelay);
    }
}
