package gms.dataacquisition.stationreceiver.cd11.common.reactor;

import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

/**
 * Functional interface for managing a flux of Cd11Frames.
 */
@FunctionalInterface
public interface Cd11FluxHandler {

  /**
   * Provide the handling behavior for a flux of Cd11Frames
   * @param frameFlux Input frame flux to handle
   * @return Disposable for lifecycle management of the frame flux handling
   */
  Disposable handle(Flux<Cd11Frame> frameFlux);

}
