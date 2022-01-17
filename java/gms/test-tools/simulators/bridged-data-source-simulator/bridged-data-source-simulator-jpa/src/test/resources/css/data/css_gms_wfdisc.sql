--min jdate = -1
--max jdate = 2286324

INSERT INTO GMS_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JIM', 'MTV', 1608149376.000000, 99, 1, -1, 9999999999.999, 44, 11, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '99-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO GMS_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JIM', 'MTV', 1608149376.000001, 2, 1, -1, 9999999999.999, 1, 1, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '2-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO GMS_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JIM', 'MTV', 1608149376.000002, 3, 1, -1, 9999999999.999, 1, 1, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '3-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));


INSERT INTO GMS_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JIM', 'VH1', 1608149376.000000, 4, 10, -1, 9999999999.999, 1, 1, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '4-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO GMS_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JIM', 'PBS', 1608149376.000001, 5, 11, -1, 9999999999.999, 1, 1, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '5-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));
INSERT INTO GMS_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JIM', 'NICK', 1608149376.000002, 6, 12, -1, 9999999999.999, 1, 1, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '6-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));


INSERT INTO GMS_SIMULATION_GLOBAL.WFDISC (STA, CHAN, TIME, WFID, CHANID, JDATE, ENDTIME, NSAMP, SAMPRATE, CALIB, CALPER, INSTYPE, SEGTYPE, DATATYPE, CLIP, DIR, DFILE, FOFF, COMMID, LDDATE)
VALUES ('JOE', 'VH1', 1608149376.000000, 3145, 99, -1, 9999999999.999, 1, 1, 1.1, 2.2, '-', 'o', 'e1', '-', '/some/path/', '4-some.file', 0, -1, TO_DATE('2020-10-26 12:47:48', 'YYYY-MM-DD HH24:MI:SS'));