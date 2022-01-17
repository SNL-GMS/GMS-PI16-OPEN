/* eslint-disable react/destructuring-assignment */
import { UILogger } from '@gms/ui-apollo';
import React, { createRef, useEffect, useState } from 'react';

interface SoundSampleProps {
  soundToPlay: string;
}

export const SoundSample: React.FunctionComponent<SoundSampleProps> = (props: SoundSampleProps) => {
  const ref = createRef<HTMLAudioElement>();
  const filename: string = props.soundToPlay?.split('/').slice(-1)[0];

  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (play && props.soundToPlay && ref.current && filename !== 'None') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ref.current.play().catch(e => {
        UILogger.Instance().error(`Error playing sound "${props.soundToPlay}": ${e}`);
      });
    }
    setPlay(true);
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.soundToPlay]);

  if (filename === 'None') {
    return null;
  }
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <audio ref={ref} src={props.soundToPlay} autoPlay={false} />;
};
