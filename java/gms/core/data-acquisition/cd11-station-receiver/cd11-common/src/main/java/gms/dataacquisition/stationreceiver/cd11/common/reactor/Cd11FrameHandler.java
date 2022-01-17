package gms.dataacquisition.stationreceiver.cd11.common.reactor;

import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

/**
 * Functional interface extension of {@link Cd11FluxHandler} providing an opinionated handling of a
 * Cd11Frame flux by declaring how to handle each individual frame.
 */
@FunctionalInterface
public interface Cd11FrameHandler extends Cd11FluxHandler {

  /**
   * Provide the handling behavior for an individual Cd11Frame, informing the default behavior of a
   * flux of Cd11Frames
   *
   * @param frame Input frame to handle
   */
  void handle(Cd11Frame frame);

  @Override
  default Disposable handle(Flux<Cd11Frame> frameFlux) {
    return frameFlux.subscribe(this::handle);
  }
}
