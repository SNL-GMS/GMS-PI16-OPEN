package gms.core.performancemonitoring.ssam.control.dataprovider;

import reactor.core.publisher.Flux;

public interface ReactiveConsumer<T> {

  Flux<T> getFlux();
}
