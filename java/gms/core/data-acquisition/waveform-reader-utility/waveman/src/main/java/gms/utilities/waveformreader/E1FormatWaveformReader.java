package gms.utilities.waveformreader;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Code for reading waveform E1 compressed format.
 */
public class E1FormatWaveformReader implements WaveformReaderInterface {

    private static final Logger logger = LoggerFactory.getLogger(E1FormatWaveformReader.class);

    /**
     * Reads the InputStream as an E1 waveform.
     */
    public double[] read(InputStream is, int numSamples, int skip) throws IOException {
        Validate.notNull(is);

        if (numSamples <= 0) {
            return new double[0];
        }

        BitInputStream bis = new BitInputStream(is, 1024);

        int maxRec = 4096;

        double[][] uncompData = new double[maxRec][];

        // Loop over each record
        int recNum;
        for (recNum = 0; recNum < maxRec && bis.available() > 0; recNum++)
        {
            // Get the size of compressed data
            int compSize = bis.read(16, false);
            if ( compSize < 0 )
                break;

            // Get the length of compressed data
            int compLength = compSize / 4 - 2;

            // Get the number of data samples
            int numSamp = bis.read(16, false);
            if ( numSamp < 0 )
                break;

            // Get the number of differences
            int numDiff = bis.read(8, false);
            if ( numDiff < 0 )
                break;

            // Get the check value
            int check = bis.read(24, true);

            // Allocate memory for the uncompressed data
            uncompData[recNum] = new double[numSamp];

            // Demap the data
            for (int i = 0, j = 0; i < compLength && j < numSamp; i++)
            {
                int code1 = bis.read(1, false);

                if (code1 == 0)
                {
                    /*
                     * 7 9-bit samples Bit map format:
                     * 0AAAAAAA|AABBBBBB|BBBCCCCC|CCCCDDDD
                     * DDDDDEEE|EEEEEEFF|FFFFFFFG|GGGGGGGG
                     */
                    for (int k=0; k<7 && j < numSamp; k++, j++)
                        uncompData[recNum][j] = bis.read(9, true);
                }
                else if (code1 == 1)
                {
                    int code2 = bis.read(1, false);

                    if (code2 == 0)
                    {
                        /*
                         * 3 10-bit samples Bit map format:
                         * 10AAAAAA|AAAABBBB|BBBBBBCC|CCCCCCCC
                         */
                        for (int k=0; k<3 && j < numSamp; k++, j++)
                            uncompData[recNum][j] = bis.read(10, true);
                    }
                    else if (code2 == 1)
                    {
                        int code3 = bis.read(2, false);

                        if (code3 == 0)
                        {
                            /*
                             * 4 7-bit samples Bit map format:
                             * 1100AAAA|AAABBBBB|BBCCCCCC|CDDDDDDD
                             */
                            for (int k=0; k<4 && j < numSamp; k++, j++)
                                uncompData[recNum][j] = bis.read(7, true);
                        }
                        else if (code3 == 1)
                        {
                            /*
                             * 5 12-bit samples Bit map format:
                             * 1101AAAA|AAAAAAAA|BBBBBBBB|BBBBCCCC
                             * CCCCCCCC|DDDDDDDD|DDDDEEEE|EEEEEEEE
                             */
                            for (int k=0; k<5 && j < numSamp; k++, j++)
                                uncompData[recNum][j] = bis.read(12, true);
                        }
                        else if (code3 == 2)
                        {
                            /*
                             * 4 15-bit samples Bit map format:
                             * 1110AAAA|AAAAAAAA|AAABBBBB|BBBBBBBB
                             * BBCCCCCC|CCCCCCCC|CDDDDDDD|DDDDDDDD
                             */
                            for (int k=0; k<4 && j < numSamp; k++, j++)
                                uncompData[recNum][j] = bis.read(15, true);
                        }
                        else if (code3 == 3)
                        {
                            /*
                             * 1 28-bit sample Bit map format:
                             * 1111AAAA|AAAAAAAA|AAAAAAAA|AAAAAAAA
                             */
                            uncompData[recNum][j++] = bis.read(28, true);
                        }
                    }
                }
            }

            // Integrate the data
            for (int i = 0; i < numDiff; i++) {
                WaveformReaderUtil.integrate(uncompData[recNum], 0, numSamp);
            }

            // Check decompression
            if (numSamp > 0 && check != uncompData[recNum][numSamp - 1]) {
                logger.error(
                    "Error decompressing, check value ({}) does not match last value ({}).", check,
                    uncompData[recNum][numSamp - 1]);
            }
        }

        // Extract the records
        long totalSamples = numSamples + skip;
        double[] data = new double[numSamples];
        long k = 0;
        for (int i = 0; i < recNum; i++) {
            for (int j = 0; j < uncompData[i].length && k < totalSamples; j++, k++) {
                if (k >= skip) {
                    data[(int) (k - skip)] = uncompData[i][j];
                }
            }
        }

        return data;
    }


}
