package gms.dataacquisition.stationreceiver.cd11.common.reactor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Frame;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.Cd11CompositeFluxHandler;
import gms.dataacquisition.stationreceiver.cd11.common.reactor.Cd11FluxHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.Disposables;
import reactor.core.publisher.Flux;

@ExtendWith(MockitoExtension.class)
class Cd11CompositeFluxHandlerTest {

  @Test
  void testFrameTypeRegistration() {
    Cd11CompositeFluxHandler handler = new Cd11CompositeFluxHandler();

    Cd11Frame dummyDataFrame = Mockito.mock(Cd11Frame.class);
    Cd11Frame dummyAlertFrame = Mockito.mock(Cd11Frame.class);

    given(dummyDataFrame.getType()).willReturn(FrameType.DATA);
    given(dummyAlertFrame.getType()).willReturn(FrameType.ALERT);

    Cd11FluxHandler mockHandler = mock(Cd11FluxHandler.class);

    handler.registerFluxHandler(FrameType.DATA, mockHandler);

    given(mockHandler.handle(any())).willReturn(Disposables.single());

    handler.handle(Flux.just(dummyDataFrame, dummyAlertFrame));

    verify(mockHandler).handle(any());
  }
}