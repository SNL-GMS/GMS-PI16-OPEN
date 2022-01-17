package gms.dataacquisition.stationreceiver.cd11.common.reactor;

import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import java.util.EnumMap;
import java.util.Map;
import org.slf4j.LoggerFactory;
import reactor.core.Disposable;
import reactor.core.Disposables;
import reactor.core.Exceptions;
import reactor.core.publisher.Flux;

/**
 * Flux handler composing multiple underlying flux handlers. Allows registration of {@link
 * Cd11FluxHandler} and {@link Cd11FrameHandler} by {@link FrameType}. Only one handler per type
 * allowed. Any FrameType without a registered handler will default to a simple draining of the
 * flux, per guidance from Project Reactor regarding groupBy behavior.
 */
public class Cd11CompositeFluxHandler implements Cd11FluxHandler {

  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(Cd11CompositeFluxHandler.class));

  private final Map<FrameType, Cd11FluxHandler> fluxHandlersByType;

  public Cd11CompositeFluxHandler() {
    this(new EnumMap<>(FrameType.class));
  }

  private Cd11CompositeFluxHandler(
      Map<FrameType, Cd11FluxHandler> fluxHandlersByType) {
    this.fluxHandlersByType = fluxHandlersByType;
  }

  /**
   * Register a flux handler for a particular frame type.
   * @param frameType Type of frames to manage
   * @param handler Handler for the frame flux
   */
  public void registerFluxHandler(FrameType frameType, Cd11FluxHandler handler) {
    fluxHandlersByType.put(frameType, handler);
  }

  /**
   * Register a frame handler for a particular frame type.
   * @param frameType Type of frames to manage
   * @param handler Handler for the frame flux
   */
  public void registerFrameHandler(FrameType frameType, Cd11FrameHandler handler) {
    logger.info("Registering frame handler for type {}", frameType);
    fluxHandlersByType.put(frameType, handler);
  }

  @Override
  public Disposable handle(Flux<Cd11Frame> frameFlux) {
    Disposable.Composite disposable = Disposables.composite();

    disposable.add(frameFlux.groupBy(Cd11Frame::getType)
        .map(gf -> handleByType(gf.key(), gf))
        .subscribe(disposable::add,
            e -> {
              throw Exceptions.propagate(e);
            }));

    return disposable;
  }

  private Disposable handleByType(FrameType frameType, Flux<Cd11Frame> groupedFrames) {
    return fluxHandlersByType.computeIfAbsent(frameType, this::drainFlux).handle(groupedFrames);
  }

  private Cd11FluxHandler drainFlux(FrameType type) {
    return flux -> flux.subscribe(frame -> logger.info("Draining unhandled {} frame", type));
  }

}
