-- Interval inserted into H2 DB used in findInterval test among others
INSERT INTO GNEM_GMS.INTERVAL_TABLE(CLASS, ENDTIME, NAME, TIME, AUTH, COMMID, INTVLID, LDDATE, MODDATE, PERCENT_AVAILABLE, PROC_END_DATE, PROC_START_DATE, STATE)
VALUES ('ARS',1619175600.00000,'AL1',1619172000.00000,'analyst5',1,1,'2021-04-23', TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'),100.0,'2021-04-23','2021-04-23','done');

-- Interval inserted into H2 DB used in findIntervalbyRange and the mod one
INSERT INTO GNEM_GMS.INTERVAL_TABLE(CLASS, ENDTIME, NAME, TIME, AUTH, COMMID, INTVLID, LDDATE, MODDATE, PERCENT_AVAILABLE, PROC_END_DATE, PROC_START_DATE, STATE)
VALUES ('AUTO',1618887600.00000,'AL1',1618884000.00000,'analyst',1,1,'2021-04-20', TO_DATE('2021-04-20 05:08:44', 'YYYY-MM-DD HH24:MI:SS'),100.0,'2021-04-20','2021-04-20','done');

-- For the tests checking the logic in the find() the INTERVAL_DAO_AUTO_AL1_DONE
-- will be used and then vary query times so that the interval falls across the start boundary
-- withing the range, and then over the end boundary
-- This interval ends one second after the other one and should not be found in those tests

INSERT INTO GNEM_GMS.INTERVAL_TABLE(CLASS, ENDTIME, NAME, TIME, AUTH, COMMID, INTVLID, LDDATE, MODDATE, PERCENT_AVAILABLE, PROC_END_DATE, PROC_START_DATE, STATE)
VALUES ('ARS',1619175601.00000,'AL1',1619172000.00000,'analyst5',1,1,'2021-04-23', TO_DATE('2021-04-23 13:49:00', 'YYYY-MM-DD HH24:MI:SS'),100.0,'2021-04-23','2021-04-23','done');

