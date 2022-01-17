create schema if not exists gms_soh;

-- TODO (sgk 1/24/2020) Figure out a better way to handle testing
create schema if not exists gms_soh_test;

comment on schema gms_soh is 'GMS State of Health Schema';

-- Enum Types
create type rsdf_payload_format as enum ('CD11', 'IMS20_SOH', 'IMS20_WAVEFORM', 'SEEDLINK', 'MINISEED');
create type authentication_status as enum('NOT_APPLICABLE', 'AUTHENTICATION_FAILED', 'AUTHENTICATION_SUCCEEDED', 'NOT_YET_AUTHENTICATED');
create type soh_status_enum as enum('GOOD', 'MARGINAL', 'BAD');
create type system_message_type_enum as enum(
    'STATION_NEEDS_ATTENTION', 'STATION_SOH_STATUS_CHANGED',
    'STATION_CAPABILITY_STATUS_CHANGED', 'STATION_GROUP_CAPABILITY_STATUS_CHANGED',
    'CHANNEL_MONITOR_TYPE_STATUS_CHANGED', 'CHANNEL_MONITOR_TYPE_STATUS_CHANGE_ACKNOWLEDGED',
    'CHANNEL_MONITOR_TYPE_QUIETED', 'CHANNEL_MONITOR_TYPE_QUIET_PERIOD_CANCELED',
    'CHANNEL_MONITOR_TYPE_QUIET_PERIOD_EXPIRED');
create type system_message_category_enum as enum('SOH');
create type system_message_sub_category_enum as enum('STATION', 'CAPABILITY', 'USER');
create type system_message_severity_enum as enum('CRITICAL', 'WARNING', 'INFO');
create type station_aggregate_type_enum as enum('LAG', 'TIMELINESS', 'MISSING', 'ENVIRONMENTAL_ISSUES');
create type soh_monitor_type_enum as enum('LAG',
                                                  'MISSING',
                                                  'TIMELINESS',
                                                  'ENV_AMPLIFIER_SATURATION_DETECTED',
                                                  'ENV_AUTHENTICATION_SEAL_BROKEN',
                                                  'ENV_BACKUP_POWER_UNSTABLE',
                                                  'ENV_BEGINNING_DATE_OUTAGE',
                                                  'ENV_BEGINNING_TIME_OUTAGE',
                                                  'ENV_CALIBRATION_UNDERWAY',
                                                  'ENV_CLIPPED',
                                                  'ENV_CLOCK_DIFFERENTIAL_IN_MICROSECONDS',
                                                  'ENV_CLOCK_DIFFERENTIAL_TOO_LARGE',
                                                  'ENV_CLOCK_LOCKED',
                                                  'ENV_DATA_AVAILABILITY_MINIMUM_CHANNELS',
                                                  'ENV_DATA_AVAILABILITY_GEOPHYSICAL_CHANNELS',
                                                  'ENV_DATA_AVAILABILITY_GEOPHYSICAL_CHANNELS_UNAUTHENTICATED',
                                                  'ENV_LAST_GPS_SYNC_TIME',
                                                  'ENV_DEAD_SENSOR_CHANNEL',
                                                  'ENV_DIGITAL_FILTER_MAY_BE_CHARGING',
                                                  'ENV_DIGITIZER_ANALOG_INPUT_SHORTED',
                                                  'ENV_DIGITIZER_CALIBRATION_LOOP_BACK',
                                                  'ENV_DIGITIZING_EQUIPMENT_OPEN',
                                                  'ENV_DURATION_OUTAGE',
                                                  'ENV_ENDING_DATE_OUTAGE',
                                                  'ENV_ENDING_TIME_OUTAGE',
                                                  'ENV_END_TIME_SERIES_BLOCKETTE',
                                                  'ENV_EQUIPMENT_HOUSING_OPEN',
                                                  'ENV_EQUIPMENT_MOVED',
                                                  'ENV_EVENT_IN_PROGRESS',
                                                  'ENV_GAP',
                                                  'ENV_GLITCHES_DETECTED',
                                                  'ENV_GPS_RECEIVER_OFF',
                                                  'ENV_GPS_RECEIVER_UNLOCKED',
                                                  'ENV_LONG_DATA_RECORD',
                                                  'ENV_MAIN_POWER_FAILURE',
                                                  'ENV_MAXIMUM_DATA_TIME',
                                                  'ENV_MEAN_AMPLITUDE',
                                                  'ENV_MISSION_CAPABILITY_STATISTIC',
                                                  'ENV_NEGATIVE_LEAP_SECOND_DETECTED',
                                                  'ENV_NUMBER_OF_CONSTANT_VALUES',
                                                  'ENV_NUMBER_OF_DATA_GAPS',
                                                  'ENV_NUMBER_OF_SAMPLES',
                                                  'ENV_OUTAGE_COMMENT',
                                                  'ENV_PERCENT_AUTHENTICATED_DATA_AVAILABLE',
                                                  'ENV_PERCENT_DATA_RECEIVED',
                                                  'ENV_PERCENT_UNAUTHENTICATED_DATA_AVAILABLE',
                                                  'ENV_PERCENTAGE_GEOPHYSICAL_CHANNEL_RECEIVED',
                                                  'ENV_POSITIVE_LEAP_SECOND_DETECTED',
                                                  'ENV_QUESTIONABLE_TIME_TAG',
                                                  'ENV_ROOT_MEAN_SQUARE_AMPLITUDE',
                                                  'ENV_SHORT_DATA_RECORD',
                                                  'ENV_SPIKE_DETECTED',
                                                  'ENV_START_TIME_SERIES_BLOCKETTE',
                                                  'ENV_STATION_EVENT_DETRIGGER',
                                                  'ENV_STATION_EVENT_TRIGGER',
                                                  'ENV_STATION_POWER_VOLTAGE',
                                                  'ENV_STATION_VOLUME_PARITY_ERROR_POSSIBLY_PRESENT',
                                                  'ENV_TELEMETRY_SYNCHRONIZATION_ERROR',
                                                  'ENV_TIMELY_DATA_AVAILABILITY',
                                                  'ENV_TIMING_CORRECTION_APPLIED',
                                                  'ENV_VAULT_DOOR_OPENED',
                                                  'ENV_ZEROED_DATA');

set search_path to gms_soh;

create table if not exists acquisition_soh_status
(
	id bigint not null
		constraint acquisition_soh_status_pkey
			primary key,
	completeness double precision not null,
	completeness_summary varchar(255) not null,
	latency bigint not null,
	latency_summary varchar(255) not null
);

create table if not exists calibration
(
	id bigint not null
		constraint calibration_pkey
			primary key,
	calibration_factor_error double precision not null,
	calibration_factor_units varchar(255) not null,
	calibration_factor_value double precision not null,
	calibration_period_sec double precision not null,
	calibration_time_shift bigint not null
);

create table if not exists channel
(
	name varchar(255) not null
		constraint channel_pkey
			primary key,
	canonical_name varchar(255) not null,
	channel_band_type varchar(255),
	channel_data_type varchar(255),
	channel_instrument_type varchar(255),
	channel_orientation_code char,
	channel_orientation_type varchar(255),
	description varchar(255) not null,
	depth double precision,
	elevation double precision,
	latitude double precision,
	longitude double precision,
	nominal_sample_rate_hz double precision,
	horizontal_angle_deg double precision not null,
	vertical_angle_deg double precision not null,
	processingdefinition jsonb,
	processingmetadata jsonb,
	units varchar(255)
);

create table if not exists channel_configured_inputs
(
	id integer not null
		constraint channel_configuredinputs_pkey
			primary key,
	channel_name varchar(255) not null
		constraint fkkh5s7dif4016k33wf9ae66w3
			references channel,
	related_channel_name varchar(255) not null
		constraint fk16jwp1gsjwiwepwuap6cs0bp7
			references channel
);

create index channel_configured_inputs_channel_name on channel_configured_inputs (channel_name);
create index channel_configured_inputs_related_channel_name on channel_configured_inputs (related_channel_name);

create table if not exists channel_env_issue_analog
(
	channel_name varchar(255) not null
		     constraint channel_env_issue_analog_channel
		     		references channel(name),
	end_time timestamp with time zone not null,
	start_time timestamp with time zone not null,
	status double precision not null,
	type varchar(255) not null,
	constraint channel_env_issue_analog_pkey
	  primary key(channel_name, type, start_time)
);
create index analog_acei_channel_idx
	on channel_env_issue_analog (channel_name);

create table if not exists channel_env_issue_boolean
(
	channel_name varchar(255) not null
		constraint channel_env_issue_boolean_channel
     		references channel(name),
	end_time timestamp with time zone not null,
	start_time timestamp with time zone not null,
	status boolean not null,
	type varchar(255) not null,
	constraint channel_env_issue_boolean_pkey
	  primary key(channel_name, type, start_time)
);
create index boolean_acei_channel_idx
	on channel_env_issue_boolean (channel_name);

create table if not exists environment_soh_status
(
	id bigint not null
		constraint environment_soh_status_pkey
			primary key
);

create table if not exists environment_soh_counts_by_type
(
	environment_soh_status_id bigint not null
		constraint fkhajylh94eew3pwhhjjwwgj93r
			references environment_soh_status,
	soh_count integer,
	acquired_channel_env_issue_type varchar(255) not null,
	constraint environment_soh_counts_by_type_pkey
		primary key (environment_soh_status_id, acquired_channel_env_issue_type)
);

create table if not exists environment_soh_status_summaries
(
	environment_soh_status_id bigint not null
		constraint fk91gimbxx2oka6ig8g15003m3d
			references environment_soh_status,
	summary varchar(255),
	acquired_channel_env_issue_type varchar(255) not null,
	constraint environment_soh_status_summaries_pkey
		primary key (environment_soh_status_id, acquired_channel_env_issue_type)
);

create table if not exists frequency_amplitude_phase
(
	id bigint not null
		constraint frequency_amplitude_phase_pkey
			primary key,
	amplitude_response double precision[],
	amplitude_response_standard_deviation double precision[],
	amplitude_response_units varchar(255),
	frequencies double precision[],
	phase_response double precision[],
	phase_response_standard_deviation double precision[],
	phase_response_units varchar(255)
);

create table if not exists raw_station_data_frame
(
	id uuid not null
		constraint raw_station_data_frame_pkey
			primary key,
	payload_format public.rsdf_payload_format,
	authentication_status public.authentication_status not null,
	payload_data_end_time timestamp not null,
	payload_data_start_time timestamp not null,
	raw_payload_blob oid not null,
	reception_time timestamp not null,
	station_name varchar(255)
);

create table if not exists raw_station_data_frame_channel_names
(
	raw_station_data_frame_id uuid not null
		constraint fkd2dysxh3wkehh8jif7a3wkcm4
			references raw_station_data_frame ON DELETE CASCADE,
	channel_name varchar(255)
);
CREATE INDEX rsdf_channel_names_raw_station_data_frame_id_idx ON raw_station_data_frame_channel_names (raw_station_data_frame_id);

create table if not exists reference_alias
(
	id uuid not null
		constraint reference_alias_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	name varchar(255),
	status integer,
	system_time timestamp
);

create table if not exists reference_calibration
(
	id bigint not null
		constraint reference_calibration_pkey
			primary key,
	calibration_interval bigint
);

create table if not exists reference_calibration_calibrations
(
	calibration_id bigint
		constraint uk_fso90u61tdneo7jblgnadrd2n
			unique
		constraint fksf2jj07rcniw8q8716eq5a3rv
			references calibration,
	reference_calibration_id bigint not null
		constraint reference_calibration_calibrations_pkey
			primary key
		constraint fk3xriu5g5v7diglvqbb6fgai7x
			references reference_calibration
);

create table if not exists reference_channel
(
	id bigint not null
		constraint reference_channel_pkey
			primary key,
	actual_time timestamp,
	band_type varchar(255),
	comment varchar(255),
	data_type varchar(255),
	depth double precision,
	elevation double precision,
	entity_id uuid,
	horizontal_angle double precision,
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null,
	instrument_type varchar(255),
	latitude double precision,
	location_code varchar(255),
	longitude double precision,
	name varchar(255),
	nominal_sample_rate double precision,
	orientation_code char,
	orientation_type varchar(255),
	east_displacement_km double precision not null,
	north_displacement_km double precision not null,
	vertical_displacement_km double precision not null,
	system_time timestamp,
	active boolean not null,
	units varchar(255),
	version_id uuid
		constraint uk_cpjva5lxy76sr7bi1vfrnn72d
			unique,
	vertical_angle double precision
);

create table if not exists reference_channel_aliases
(
	reference_channel bigint not null
		constraint fk8bq0pgo1ig69ww3hllbfxkb02
			references reference_channel,
	reference_alias uuid not null
		constraint uk_2yfd7375kwpqqt1waq1bxplus
			unique
		constraint fke0h8b4qyqivr3csoffmexfasr
			references reference_alias
);

create table if not exists reference_digitizer
(
	id bigint not null
		constraint reference_digitizer_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	description varchar(255),
	entity_id uuid,
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null,
	manufacturer varchar(255),
	model varchar(255),
	name varchar(255),
	serial_number varchar(255),
	system_time timestamp,
	version_id uuid
		constraint uk_lvitx6uiejh7ed8k4828l51bu
			unique
);

create table if not exists reference_digitizer_membership
(
	primarykey bigint not null
		constraint reference_digitizer_membership_pkey
			primary key,
	actual_time timestamp,
	channel_id uuid,
	comment varchar(255),
	digitizer_id uuid,
	id uuid
		constraint uk_pfg6imcn0nfc7kylt03rpcm3y
			unique,
	status integer,
	system_time timestamp
);

create table if not exists reference_network
(
	id bigint not null
		constraint reference_network_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	description varchar(255),
	entity_id uuid,
	name varchar(255),
	org integer,
	region integer,
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null,
	system_time timestamp,
	active boolean not null,
	version_id uuid
		constraint uk_c0mwh7ciqyisa73uwyqr7yp6d
			unique
);

create table if not exists reference_network_membership
(
	id uuid not null
		constraint reference_network_membership_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	network_id uuid,
	station_id uuid,
	status integer,
	system_time timestamp
);

create table if not exists reference_response
(
	id uuid not null
		constraint reference_response_pkey
			primary key,
	actual_time timestamp not null,
	channel_name varchar(255) not null,
	comment varchar(255),
	system_time timestamp not null
);

create table if not exists reference_response_frequency_amplitude_phase
(
	reference_frequency_amplitude_phase_id bigint
		constraint fkmih5x6k2uyfx94ban8mo9rpsj
			references frequency_amplitude_phase,
	reference_response_id uuid not null
		constraint reference_response_frequency_amplitude_phase_pkey
			primary key
		constraint fkk68g11989wf17rqrps58bntil
			references reference_response
);

create table if not exists reference_response_reference_calibrations
(
	reference_calibration_id bigint
		constraint fkc569ke3xpjn9o5bog057jbo2v
			references reference_calibration,
	reference_response_id uuid not null
		constraint reference_response_reference_calibrations_pkey
			primary key
		constraint fkr8amjtn7f2fafdr4ju81wker7
			references reference_response
);

create table if not exists reference_sensor
(
	id uuid not null
		constraint reference_sensor_pkey
			primary key,
	actual_time timestamp,
	channel_name varchar(255),
	comment varchar(255),
	corner_period double precision,
	high_passband double precision,
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null,
	instrument_manufacturer varchar(255),
	instrument_model varchar(255),
	low_passband double precision,
	number_of_components integer,
	serial_number varchar(255),
	system_time timestamp
);

create table if not exists reference_site
(
	id bigint not null
		constraint reference_site_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	description varchar(255),
	elevation double precision,
	entity_id uuid,
	latitude double precision,
	longitude double precision,
	name varchar(255),
	east_displacement_km double precision not null,
	north_displacement_km double precision not null,
	vertical_displacement_km double precision not null,
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null,
	system_time timestamp,
	active boolean not null,
	version_id uuid
		constraint uk_5196wdb3h5ruce4qkxgylpmf3
			unique
);

create table if not exists reference_site_aliases
(
	reference_site bigint not null
		constraint fkdfpjc0w7x23m6jkoyegv655ds
			references reference_site,
	reference_alias uuid not null
		constraint uk_oac82rneiqtcj788ratg0ygjl
			unique
		constraint fk63bhnh2g43q845e45abtcl5n5
			references reference_alias
);

create table if not exists reference_site_membership
(
	primarykey bigint not null
		constraint reference_site_membership_pkey
			primary key,
	actual_time timestamp,
	channel_name varchar(255),
	comment varchar(255),
	id uuid
		constraint uk_18yk8igpb537ykelf5gdup3j3
			unique,
	site_id uuid,
	status integer,
	system_time timestamp
);

create table if not exists reference_source_response
(
	id bigint not null
		constraint reference_source_response_pkey
			primary key,
	source_response_data bytea not null,
	source_response_type integer not null,
	source_response_units varchar(255) not null
);

create table if not exists reference_response_reference_source_response
(
	reference_source_response_id bigint
		constraint fkkfmlyafsvoyvimmayxpxgie3l
			references reference_source_response,
	reference_response_id uuid not null
		constraint reference_response_reference_source_response_pkey
			primary key
		constraint fkix8mjmei9y2cri3ce8ybldc8h
			references reference_response
);

create table if not exists reference_source_response_information_sources
(
	reference_source_response_id bigint not null
		constraint fknr7sa2hhxbappoe0ox9l5t0lg
			references reference_source_response,
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null
);

create table if not exists reference_station
(
	id bigint not null
		constraint reference_station_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	description varchar(255),
	elevation double precision,
	entity_id uuid,
	latitude double precision,
	longitude double precision,
	name varchar(255),
	information_time timestamp not null,
	originating_organization varchar(255) not null,
	reference varchar(255) not null,
	station_type integer,
	system_time timestamp,
	active boolean not null,
	version_id uuid
		constraint uk_a4liqhl28yvqbql3wvk2hpkn
			unique
);

create table if not exists reference_station_aliases
(
	reference_station bigint not null
		constraint fk3i8o7osa8subv1yv9xosw2e20
			references reference_station,
	reference_alias uuid not null
		constraint uk_qdsbi43vmjpa1d96v0dsd2met
			unique
		constraint fkot5ntwxqsv31pguf8td7yywam
			references reference_alias
);

create table if not exists reference_station_membership
(
	id uuid not null
		constraint reference_station_membership_pkey
			primary key,
	actual_time timestamp,
	comment varchar(255),
	site_id uuid,
	station_id uuid,
	status integer,
	system_time timestamp
);

create sequence if not exists channel_configured_inputs_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_site_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_site_membership_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_network_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_channel_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_digitizer_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_calibration_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_station_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists reference_source_response_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists transferred_rsdf_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists transferred_file_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists transferred_file_invoice_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists station_soh_issue_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists calibration_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists frequency_amplitude_phase_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create sequence if not exists waveform_summary_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;

create table if not exists response
(
	id uuid not null
		constraint response_pkey
			primary key,
	channel_name varchar(255)
		constraint uk_loshdqpmvdlilkl8nk4keikq2
			unique
		constraint fkhdo9c0el9dxe0wnn65x8v9bju
			references channel
);

create table if not exists response_calibrations
(
	calibration_id bigint
		constraint fkgrlpluuyqkg5lrvnky4hbubuy
			references calibration,
	response_id uuid not null
		constraint response_calibrations_pkey
			primary key
		constraint fkavf2r6e23hew4i0xqwt3jeoil
			references response
);

create table if not exists response_frequency_amplitude_phase
(
	frequency_amplitude_phase_id bigint
		constraint fkpg2cao0rbn1ifmcydw78l9p9r
			references frequency_amplitude_phase,
	response_id uuid not null
		constraint response_frequency_amplitude_phase_pkey
			primary key
		constraint fkktm28oscsjlc59r3r144y7ecb
			references response
);

create table if not exists soh_status
(
	id bigint not null
		constraint soh_status_pkey
			primary key,
	soh_status_env_status bigint
		constraint fkjagfdq7lccpdk5buuj19jm3us
			references environment_soh_status,
	soh_status_acq_status bigint not null
		constraint fk2qmod61yb5iqmk5kym7h8nww0
			references acquisition_soh_status
);

create table if not exists station
(
	name varchar(255) not null
		constraint station_pkey
			primary key,
	description varchar(1024) not null,
	depth double precision,
	elevation double precision,
	latitude double precision,
	longitude double precision,
	station_type varchar(255)
);

create table if not exists channel_group
(
	name varchar(255) not null
		constraint channel_group_pkey
			primary key,
	description varchar(255) not null,
	depth double precision,
	elevation double precision,
	latitude double precision,
	longitude double precision,
	type varchar(255),
	station_name varchar(255) not null
		constraint fklx0h0xrborbrx3m4d1qcvj2si
			references station
);

create index channel_group_station_idx on channel_group (station_name);

create table if not exists channel_group_channels
(
	channel_group_name varchar(255) not null
		constraint fksvjxwrjrcxlt2csn10a8vx1s3
			references channel_group,
	channel_name varchar(255) not null
		constraint fkpk8oa9rxtrfep8bftbje9usmk
			references channel
);

create index channel_group_channels_channel_group_idx on channel_group_channels (channel_group_name);
create index channel_group_channels_channel_idx on channel_group_channels (channel_name);

create table if not exists station_channel_info
(
	east_displacement_km double precision,
	north_displacement_km double precision,
	vertical_displacement_km double precision,
	channel_name varchar(255) not null
		constraint fk8jddgk6ss5b7kg9k9ys61vq6w
			references channel,
	station_name varchar(255) not null
		constraint fk42f4fhj6abkml9tre2dowbkl3
			references station,
	constraint station_channel_info_pkey
		primary key (channel_name, station_name)
);

create index station_channel_info_station_idx on station_channel_info (station_name);
create index station_channel_info_channel_idx on station_channel_info (channel_name);

create table if not exists station_group
(
	name varchar(255) not null
		constraint station_group_pkey
			primary key,
	description varchar(1024) not null
);

create table if not exists station_group_soh_status
(
	id uuid not null
		constraint station_group_soh_status_pkey
			primary key,
	end_time timestamp not null,
	soh_status_summary varchar(255) not null,
	start_time timestamp not null,
	station_group_name varchar(255) not null
		constraint station_goup_soh_status_station_group_fkey
			   references station_group 
);

create table if not exists station_group_stations
(
	station_group_name varchar(255) not null
		constraint fksn5vxm0l1o87ou6fakin0phqs
			references station_group,
	station_name varchar(255) not null
		constraint fklawgmjdptkps6pc4ah8c1cuov
			references station
);

create table if not exists station_soh_issue
(
	id bigint not null
		constraint station_soh_issue_pkey
			primary key,
	acknowledged_at timestamp,
	requires_acknowledgement boolean not null
);

create table if not exists station_soh_status
(
	id bigint not null
		constraint station_soh_status_pkey
			primary key,
	soh_status_summary varchar(255) not null,
	station_name varchar(255) not null,
	soh_status bigint not null
		constraint fk1p2v2840sjwjbltg3jjvvlpbi
			references soh_status,
	station_soh_issue bigint not null
		constraint fkhuj1sm4yvleb0fo9fbgnv0qlk
			references station_soh_issue,
	station_soh_status uuid
		constraint fkd13qfp7megyrfryiwfgm30ulv
			references station_group_soh_status
);

create table if not exists channel_soh_status
(
	id bigint not null
		constraint channel_soh_status_pkey
			primary key,
	channel_name varchar(255) not null
		constraint channel_soh_status_channel_fkey
			   references channel,
	soh_status bigint not null
		constraint fkhncc287qt2vhs9yccdl4gn88b
			references soh_status,
	channel_soh_status bigint
		constraint fkfp4jvfmyxp1v8j0ykuor50mmr
			references station_soh_status
);

create table if not exists transferred_file
(
	id bigint not null
		constraint transferred_file_pkey
			primary key,
	file_name varchar(255),
	metadata_type integer not null,
	priority varchar(255),
	reception_time timestamp,
	status varchar(255),
	transfer_time timestamp
);

create table if not exists transferred_file_invoice
(
	sequence_number bigint not null,
	id bigint not null
		constraint transferred_file_invoice_pkey
			primary key
		constraint fkoqoav67hkc04s21jrclhdl9ht
			references transferred_file
);

create table if not exists transferred_file_raw_station_data_frame
(
	payload_end_time timestamp not null,
	payload_start_time timestamp not null,
	station_name varchar(255),
	id bigint not null
		constraint transferred_file_raw_station_data_frame_pkey
			primary key
		constraint fk5dd4lkvjirm17c70d24fn0kxb
			references transferred_file
);

create table if not exists transferred_file_rsdf_metadata_channel_names
(
	channel_name bigint not null
		constraint fk8cxrw4j7s3wwx6w1mq7egj56a
			references transferred_file_raw_station_data_frame,
	channelnames varchar(255)
);

create table if not exists user_preferences
(
	id varchar(255) not null
		constraint user_preferences_pkey
			primary key,
	default_analyst_layout_name varchar(255),
	default_soh_layout_name varchar(255)
);

create table if not exists workspace_layout
(
	id uuid not null
	   constraint workspace_layout_pkey
	   	      primary key,
	layout_configuration text,
	name varchar(255),
	user_preferences_id varchar(255) not null
		constraint fkeenj804td36yjtle7mhdl2akn
			references user_preferences
);

create table if not exists audible_notification
(
	id uuid not null
	   constraint audible_notification_pkey
	   	      primary key,
    notification_type public.system_message_type_enum not null,
	file_name varchar(255) not null,
	user_preferences_id varchar(255) not null
	    constraint fk_user_prefs_notifications
	        references user_preferences
);

create table if not exists workspace_layout_supported_ui_modes
(
	workspace_layout_id uuid not null
		constraint fk_workspace_layout_ui_mode
			   references workspace_layout,
	supported_user_interface_mode varchar(255)
);			  

create table if not exists waveform_summary
(
	id bigint not null
		constraint waveform_summary_pkey
			primary key,
	channel_name varchar(255) not null,
	end_time timestamp not null,
	start_time timestamp not null,
	raw_station_data_frame_id uuid
		constraint fkm7fnlgi5cjf4mplnayqqy6vj
			references raw_station_data_frame ON DELETE CASCADE
);
CREATE INDEX waveform_summary_raw_station_data_frame_id_idx ON waveform_summary (raw_station_data_frame_id);
create index channel_name_end_time_idx on waveform_summary (channel_name, end_time);

-- new state of health objects (as part of the SOH capability guidance)

-- To add/update the created partitions for station_soh:
--
-- 1. delete desired create station_soh partition statements e.g.
-- 2. select * from gms_soh.create_partition_statements;
-- 3. copy and paste all records from the create_statements column to update the below created partitions
--   3a. copy below the commented line that says "copy output of select from gms_soh.create_partition_statements below"
-- 4. remember to keep the default partition for anything that won't be stored in one of the station specific partitions (note repeated below)
-- 5. copy alter_statements column output to the line below the commented line "begin set owner on partitions of station_soh"
-- 6. copy grant_statements column output to the line below the commented line "begin set grants on partitions of station_soh"
--
-- view to generate create station_soh partition DDL
create or replace view create_partition_statements as
  select 'create table if not exists station_soh_' || lower(name::text) ||
  ' partition of station_soh for values in (''' || name::text || ''');' as
  create_statements,
  'alter table station_soh_' || lower(name::text) || ' owner to gms_admin;' as
  alter_statements,
  'grant select, delete, update on station_soh_' || lower(name::text) || ' to gms_soh_ttl_application;' as
  grant_statements
  from gms_soh.station;

create sequence if not exists smvs_sequence increment by 10 minvalue 1 no maxvalue start with 1 no cycle;

create sequence if not exists station_soh_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;
create table if not exists station_soh(
	id int not null,
	coi_id uuid not null,
	creation_time timestamp not null,
	station_name varchar(255) not null
		constraint fk_station_soh_station
			references station(name),
	soh_status public.soh_status_enum not null,
	primary key (station_name, id)
) partition by list(station_name);

create index station_soh_station_name_idx on station_soh (station_name);
create index station_soh_coi_id_idx on station_soh (coi_id);
create index station_soh_creation_time_idx on station_soh (creation_time);

-- start of station_soh partitions
--
-- copy output of select from gms_soh.create_partition_statements below
create table if not exists station_soh_afi partition of station_soh for values in ('AFI');
create table if not exists station_soh_anmo partition of station_soh for values in ('ANMO');
create table if not exists station_soh_apg partition of station_soh for values in ('APG');
create table if not exists station_soh_asar partition of station_soh for values in ('ASAR');
create table if not exists station_soh_atah partition of station_soh for values in ('ATAH');
create table if not exists station_soh_atd partition of station_soh for values in ('ATD');
create table if not exists station_soh_bbb partition of station_soh for values in ('BBB');
create table if not exists station_soh_bbts partition of station_soh for values in ('BBTS');
create table if not exists station_soh_bdfb partition of station_soh for values in ('BDFB');
create table if not exists station_soh_bosa partition of station_soh for values in ('BOSA');
create table if not exists station_soh_cfa partition of station_soh for values in ('CFA');
create table if not exists station_soh_cmig partition of station_soh for values in ('CMIG');
create table if not exists station_soh_cpup partition of station_soh for values in ('CPUP');
create table if not exists station_soh_cta partition of station_soh for values in ('CTA');
create table if not exists station_soh_dbic partition of station_soh for values in ('DBIC');
create table if not exists station_soh_dlbc partition of station_soh for values in ('DLBC');
create table if not exists station_soh_dzm partition of station_soh for values in ('DZM');
create table if not exists station_soh_eka partition of station_soh for values in ('EKA');
create table if not exists station_soh_elk partition of station_soh for values in ('ELK');
create table if not exists station_soh_fitz partition of station_soh for values in ('FITZ');
create table if not exists station_soh_frb partition of station_soh for values in ('FRB');
create table if not exists station_soh_furi partition of station_soh for values in ('FURI');
create table if not exists station_soh_gumo partition of station_soh for values in ('GUMO');
create table if not exists station_soh_h01w partition of station_soh for values in ('H01W');
create table if not exists station_soh_h03n partition of station_soh for values in ('H03N');
create table if not exists station_soh_h03s partition of station_soh for values in ('H03S');
create table if not exists station_soh_h06e partition of station_soh for values in ('H06E');
create table if not exists station_soh_h06n partition of station_soh for values in ('H06N');
create table if not exists station_soh_h06s partition of station_soh for values in ('H06S');
create table if not exists station_soh_h08n partition of station_soh for values in ('H08N');
create table if not exists station_soh_h08s partition of station_soh for values in ('H08S');
create table if not exists station_soh_h10n partition of station_soh for values in ('H10N');
create table if not exists station_soh_h10s partition of station_soh for values in ('H10S');
create table if not exists station_soh_h11n partition of station_soh for values in ('H11N');
create table if not exists station_soh_h11s partition of station_soh for values in ('H11S');
create table if not exists station_soh_hnr partition of station_soh for values in ('HNR');
create table if not exists station_soh_i02ar partition of station_soh for values in ('I02AR');
create table if not exists station_soh_i03au partition of station_soh for values in ('I03AU');
create table if not exists station_soh_i05au partition of station_soh for values in ('I05AU');
create table if not exists station_soh_i06au partition of station_soh for values in ('I06AU');
create table if not exists station_soh_i07au partition of station_soh for values in ('I07AU');
create table if not exists station_soh_i08bo partition of station_soh for values in ('I08BO');
create table if not exists station_soh_i09br partition of station_soh for values in ('I09BR');
create table if not exists station_soh_i10ca partition of station_soh for values in ('I10CA');
create table if not exists station_soh_i11cv partition of station_soh for values in ('I11CV');
create table if not exists station_soh_i13cl partition of station_soh for values in ('I13CL');
create table if not exists station_soh_i17ci partition of station_soh for values in ('I17CI');
create table if not exists station_soh_i18dk partition of station_soh for values in ('I18DK');
create table if not exists station_soh_i19dj partition of station_soh for values in ('I19DJ');
create table if not exists station_soh_i20ec partition of station_soh for values in ('I20EC');
create table if not exists station_soh_i22fr partition of station_soh for values in ('I22FR');
create table if not exists station_soh_i24fr partition of station_soh for values in ('I24FR');
create table if not exists station_soh_i32ke partition of station_soh for values in ('I32KE');
create table if not exists station_soh_i33mg partition of station_soh for values in ('I33MG');
create table if not exists station_soh_i35na partition of station_soh for values in ('I35NA');
create table if not exists station_soh_i36nz partition of station_soh for values in ('I36NZ');
create table if not exists station_soh_i39pw partition of station_soh for values in ('I39PW');
create table if not exists station_soh_i40pg partition of station_soh for values in ('I40PG');
create table if not exists station_soh_i41py partition of station_soh for values in ('I41PY');
create table if not exists station_soh_i42pt partition of station_soh for values in ('I42PT');
create table if not exists station_soh_i47za partition of station_soh for values in ('I47ZA');
create table if not exists station_soh_i48tn partition of station_soh for values in ('I48TN');
create table if not exists station_soh_i49gb partition of station_soh for values in ('I49GB');
create table if not exists station_soh_i50gb partition of station_soh for values in ('I50GB');
create table if not exists station_soh_i53us partition of station_soh for values in ('I53US');
create table if not exists station_soh_i55us partition of station_soh for values in ('I55US');
create table if not exists station_soh_i56us partition of station_soh for values in ('I56US');
create table if not exists station_soh_i57us partition of station_soh for values in ('I57US');
create table if not exists station_soh_i58us partition of station_soh for values in ('I58US');
create table if not exists station_soh_i59us partition of station_soh for values in ('I59US');
create table if not exists station_soh_i60us partition of station_soh for values in ('I60US');
create table if not exists station_soh_ilar partition of station_soh for values in ('ILAR');
create table if not exists station_soh_ink partition of station_soh for values in ('INK');
create table if not exists station_soh_jts partition of station_soh for values in ('JTS');
create table if not exists station_soh_kdak partition of station_soh for values in ('KDAK');
create table if not exists station_soh_kest partition of station_soh for values in ('KEST');
create table if not exists station_soh_kmbo partition of station_soh for values in ('KMBO');
create table if not exists station_soh_kowa partition of station_soh for values in ('KOWA');
create table if not exists station_soh_krvt partition of station_soh for values in ('KRVT');
create table if not exists station_soh_lbtb partition of station_soh for values in ('LBTB');
create table if not exists station_soh_lpaz partition of station_soh for values in ('LPAZ');
create table if not exists station_soh_lpig partition of station_soh for values in ('LPIG');
create table if not exists station_soh_lsz partition of station_soh for values in ('LSZ');
create table if not exists station_soh_lvc partition of station_soh for values in ('LVC');
create table if not exists station_soh_matp partition of station_soh for values in ('MATP');
create table if not exists station_soh_maw partition of station_soh for values in ('MAW');
create table if not exists station_soh_mbar partition of station_soh for values in ('MBAR');
create table if not exists station_soh_mdt partition of station_soh for values in ('MDT');
create table if not exists station_soh_msku partition of station_soh for values in ('MSKU');
create table if not exists station_soh_msvf partition of station_soh for values in ('MSVF');
create table if not exists station_soh_new partition of station_soh for values in ('NEW');
create table if not exists station_soh_nna partition of station_soh for values in ('NNA');
create table if not exists station_soh_nvar partition of station_soh for values in ('NVAR');
create table if not exists station_soh_nwao partition of station_soh for values in ('NWAO');
create table if not exists station_soh_opo partition of station_soh for values in ('OPO');
create table if not exists station_soh_pcrv partition of station_soh for values in ('PCRV');
create table if not exists station_soh_pdar partition of station_soh for values in ('PDAR');
create table if not exists station_soh_pfo partition of station_soh for values in ('PFO');
create table if not exists station_soh_plca partition of station_soh for values in ('PLCA');
create table if not exists station_soh_pmg partition of station_soh for values in ('PMG');
create table if not exists station_soh_pmsa partition of station_soh for values in ('PMSA');
create table if not exists station_soh_ppt partition of station_soh for values in ('PPT');
create table if not exists station_soh_ptga partition of station_soh for values in ('PTGA');
create table if not exists station_soh_qspa partition of station_soh for values in ('QSPA');
create table if not exists station_soh_rao partition of station_soh for values in ('RAO');
create table if not exists station_soh_rar partition of station_soh for values in ('RAR');
create table if not exists station_soh_rcbr partition of station_soh for values in ('RCBR');
create table if not exists station_soh_res partition of station_soh for values in ('RES');
create table if not exists station_soh_rosc partition of station_soh for values in ('ROSC');
create table if not exists station_soh_rpn partition of station_soh for values in ('RPN');
create table if not exists station_soh_rpz partition of station_soh for values in ('RPZ');
create table if not exists station_soh_sado partition of station_soh for values in ('SADO');
create table if not exists station_soh_schq partition of station_soh for values in ('SCHQ');
create table if not exists station_soh_sdv partition of station_soh for values in ('SDV');
create table if not exists station_soh_shem partition of station_soh for values in ('SHEM');
create table if not exists station_soh_siv partition of station_soh for values in ('SIV');
create table if not exists station_soh_sjg partition of station_soh for values in ('SJG');
create table if not exists station_soh_snaa partition of station_soh for values in ('SNAA');
create table if not exists station_soh_sur partition of station_soh for values in ('SUR');
create table if not exists station_soh_teig partition of station_soh for values in ('TEIG');
create table if not exists station_soh_tkl partition of station_soh for values in ('TKL');
create table if not exists station_soh_tord partition of station_soh for values in ('TORD');
create table if not exists station_soh_tsum partition of station_soh for values in ('TSUM');
create table if not exists station_soh_txar partition of station_soh for values in ('TXAR');
create table if not exists station_soh_ulm partition of station_soh for values in ('ULM');
create table if not exists station_soh_urz partition of station_soh for values in ('URZ');
create table if not exists station_soh_usha partition of station_soh for values in ('USHA');
create table if not exists station_soh_vnda partition of station_soh for values in ('VNDA');
create table if not exists station_soh_wra partition of station_soh for values in ('WRA');
create table if not exists station_soh_ybh partition of station_soh for values in ('YBH');
create table if not exists station_soh_yka partition of station_soh for values in ('YKA');
create table if not exists station_soh_aak partition of station_soh for values in ('AAK');
create table if not exists station_soh_akasg partition of station_soh for values in ('AKASG');
create table if not exists station_soh_akto partition of station_soh for values in ('AKTO');
create table if not exists station_soh_arces partition of station_soh for values in ('ARCES');
create table if not exists station_soh_arti partition of station_soh for values in ('ARTI');
create table if not exists station_soh_asf partition of station_soh for values in ('ASF');
create table if not exists station_soh_bati partition of station_soh for values in ('BATI');
create table if not exists station_soh_belg partition of station_soh for values in ('BELG');
create table if not exists station_soh_bjt partition of station_soh for values in ('BJT');
create table if not exists station_soh_borg partition of station_soh for values in ('BORG');
create table if not exists station_soh_brdh partition of station_soh for values in ('BRDH');
create table if not exists station_soh_brmar partition of station_soh for values in ('BRMAR');
create table if not exists station_soh_brtr partition of station_soh for values in ('BRTR');
create table if not exists station_soh_bvar partition of station_soh for values in ('BVAR');
create table if not exists station_soh_cmar partition of station_soh for values in ('CMAR');
create table if not exists station_soh_dav partition of station_soh for values in ('DAV');
create table if not exists station_soh_davox partition of station_soh for values in ('DAVOX');
create table if not exists station_soh_eil partition of station_soh for values in ('EIL');
create table if not exists station_soh_esdc partition of station_soh for values in ('ESDC');
create table if not exists station_soh_fines partition of station_soh for values in ('FINES');
create table if not exists station_soh_geres partition of station_soh for values in ('GERES');
create table if not exists station_soh_geyt partition of station_soh for values in ('GEYT');
create table if not exists station_soh_gni partition of station_soh for values in ('GNI');
create table if not exists station_soh_h05n partition of station_soh for values in ('H05N');
create table if not exists station_soh_h05s partition of station_soh for values in ('H05S');
create table if not exists station_soh_h07n partition of station_soh for values in ('H07N');
create table if not exists station_soh_h07s partition of station_soh for values in ('H07S');
create table if not exists station_soh_h09n partition of station_soh for values in ('H09N');
create table if not exists station_soh_h09w partition of station_soh for values in ('H09W');
create table if not exists station_soh_hfs partition of station_soh for values in ('HFS');
create table if not exists station_soh_idi partition of station_soh for values in ('IDI');
create table if not exists station_soh_jay partition of station_soh for values in ('JAY');
create table if not exists station_soh_jcj partition of station_soh for values in ('JCJ');
create table if not exists station_soh_jhj partition of station_soh for values in ('JHJ');
create table if not exists station_soh_jka partition of station_soh for values in ('JKA');
create table if not exists station_soh_jmic partition of station_soh for values in ('JMIC');
create table if not exists station_soh_jnu partition of station_soh for values in ('JNU');
create table if not exists station_soh_jow partition of station_soh for values in ('JOW');
create table if not exists station_soh_kapi partition of station_soh for values in ('KAPI');
create table if not exists station_soh_kbz partition of station_soh for values in ('KBZ');
create table if not exists station_soh_kirv partition of station_soh for values in ('KIRV');
create table if not exists station_soh_klr partition of station_soh for values in ('KLR');
create table if not exists station_soh_ksrs partition of station_soh for values in ('KSRS');
create table if not exists station_soh_kurk partition of station_soh for values in ('KURK');
create table if not exists station_soh_kvar partition of station_soh for values in ('KVAR');
create table if not exists station_soh_lem partition of station_soh for values in ('LEM');
create table if not exists station_soh_lzdm partition of station_soh for values in ('LZDM');
create table if not exists station_soh_ma2 partition of station_soh for values in ('MA2');
create table if not exists station_soh_mdp partition of station_soh for values in ('MDP');
create table if not exists station_soh_mjar partition of station_soh for values in ('MJAR');
create table if not exists station_soh_mkar partition of station_soh for values in ('MKAR');
create table if not exists station_soh_mlr partition of station_soh for values in ('MLR');
create table if not exists station_soh_mmai partition of station_soh for values in ('MMAI');
create table if not exists station_soh_noa partition of station_soh for values in ('NOA');
create table if not exists station_soh_nrik partition of station_soh for values in ('NRIK');
create table if not exists station_soh_obn partition of station_soh for values in ('OBN');
create table if not exists station_soh_palk partition of station_soh for values in ('PALK');
create table if not exists station_soh_petk partition of station_soh for values in ('PETK');
create table if not exists station_soh_psi partition of station_soh for values in ('PSI');
create table if not exists station_soh_sey partition of station_soh for values in ('SEY');
create table if not exists station_soh_sfjd partition of station_soh for values in ('SFJD');
create table if not exists station_soh_siji partition of station_soh for values in ('SIJI');
create table if not exists station_soh_sonm partition of station_soh for values in ('SONM');
create table if not exists station_soh_spits partition of station_soh for values in ('SPITS');
create table if not exists station_soh_tgy partition of station_soh for values in ('TGY');
create table if not exists station_soh_tixi partition of station_soh for values in ('TIXI');
create table if not exists station_soh_tly partition of station_soh for values in ('TLY');
create table if not exists station_soh_usrk partition of station_soh for values in ('USRK');
create table if not exists station_soh_vae partition of station_soh for values in ('VAE');
create table if not exists station_soh_vrac partition of station_soh for values in ('VRAC');
create table if not exists station_soh_wsar partition of station_soh for values in ('WSAR');
create table if not exists station_soh_yak partition of station_soh for values in ('YAK');
create table if not exists station_soh_zalv partition of station_soh for values in ('ZALV');
create table if not exists station_soh_h04n partition of station_soh for values in ('H04N');
create table if not exists station_soh_h04s partition of station_soh for values in ('H04S');
create table if not exists station_soh_i21fr partition of station_soh for values in ('I21FR');
create table if not exists station_soh_i23fr partition of station_soh for values in ('I23FR');
create table if not exists station_soh_i34mn partition of station_soh for values in ('I34MN');
create table if not exists station_soh_i27de partition of station_soh for values in ('I27DE');
create table if not exists station_soh_i30jp partition of station_soh for values in ('I30JP');
create table if not exists station_soh_i37no partition of station_soh for values in ('I37NO');
create table if not exists station_soh_i43ru partition of station_soh for values in ('I43RU');
create table if not exists station_soh_i44ru partition of station_soh for values in ('I44RU');
create table if not exists station_soh_i45ru partition of station_soh for values in ('I45RU');
create table if not exists station_soh_i46ru partition of station_soh for values in ('I46RU');
create table if not exists station_soh_i51gb partition of station_soh for values in ('I51GB');
create table if not exists station_soh_i52gb partition of station_soh for values in ('I52GB');

-- always keep the default partition for anything that won't be stored in one of the above partitions
create table if not exists station_soh_default partition of station_soh default;
--
-- end of station_soh partitions

create sequence if not exists channel_soh_sequence increment by 5 minvalue 1 no maxvalue start with 1 no cycle;

create table if not exists channel_soh(
  id int not null
	  constraint channel_soh_pkey
	    primary key,
	channel_name varchar(255) not null
		constraint fk_channel_soh_channel_name
			references channel(name),			
	soh_status public.soh_status_enum not null,
	station_soh_station_name varchar(255),
	station_soh_id int,
	  foreign key (station_soh_station_name, station_soh_id) references station_soh(station_name, id) on delete cascade
);
create index channel_soh_channel_name_idx on channel_soh (channel_name);
create index channel_soh_station_soh_id_idx on channel_soh (station_soh_id);

create sequence if not exists station_aggregate_sequence increment by 50 minvalue 1 no maxvalue start with 1 no cycle;

create table if not exists station_aggregate(
    id bigint not null
      constraint station_aggregate_pkey
      primary key,
	  station_soh_station_name varchar(255),
    station_soh_id int,
    duration bigint,
    percent double precision,
    aggregate_type public.station_aggregate_type_enum not null,
    type varchar(255) not null,
			foreign key (station_soh_station_name, station_soh_id) references station_soh(station_name, id) on delete cascade
);
create index sa_station_soh_id_idx on station_aggregate (station_soh_id);

create table if not exists soh_monitor_value_status(
    id int not null
	   	constraint soh_monitor_value_status_pkey
			primary key,
	duration int,
	percent real,
	station_soh_station_name varchar(255),
	channel_soh_id int
	  constraint fk_channel_smvs_channel_soh
			references channel_soh(id) ON DELETE CASCADE,
	station_soh_id int,
	status smallint not null,
	monitor_type smallint not null,
	  foreign key (station_soh_station_name, station_soh_id) references station_soh(station_name, id) on delete cascade
);
create index smvs_channel_soh_id_idx on soh_monitor_value_status (channel_soh_id);
create index smvs_station_smvs_idx on soh_monitor_value_status (station_soh_id);

create table if not exists soh_status_change_event(
	id uuid not null
    constraint soh_status_change_event_pkey primary key,
	station_name varchar(200) not null
	  constraint fk_soh_status_change_event_station
	    references station(name)
);
alter table soh_status_change_event
add constraint station_for_soh_status_change_event_unique UNIQUE(station_name);


create table if not exists soh_status_change_collection(
  unack_id uuid not null
    constraint fk_soh_status_change_collection_soh_status_change_event
      references soh_status_change_event(id) ON DELETE CASCADE,
  first_change_time timestamp not null,
  soh_monitor_type public.soh_monitor_type_enum not null,
  channel_name varchar(200) not null
    constraint fk_soh_status_change_collection_channel
    references channel(name)
);
alter table soh_status_change_collection
add constraint station_channel_change_time_monitor_type_unique UNIQUE(unack_id, first_change_time, soh_monitor_type, channel_name);

create table if not exists soh_status_change_quieted(
  soh_status_change_quieted_id uuid not null,
	quiet_until timestamp not null,
	quiet_duration bigint not null,
	soh_monitor_type public.soh_monitor_type_enum not null,
	comment varchar(1024),
  channel_name varchar(255) not null
		constraint fk_soh_status_change_quieted_channel
			references channel(name),
  station_name varchar(255) not null
    constraint fk_soh_status_change_quieted_station
      references station(name)
);

alter table soh_status_change_quieted
add constraint channel_name_station_monitor_type_unique UNIQUE(soh_monitor_type, channel_name);;

create table if not exists capability_soh_rollup(
  id uuid not null
    constraint capability_soh_rollup_pkey primary key,
  capability_rollup_time timestamp not null,
  group_rollup_status public.soh_status_enum not null,
  station_group_name varchar(255) not null
    constraint fk_capability_soh_rollup_station_group_rollup_status
      references station_group(name)
);

CREATE INDEX capability_soh_rollup_capability_rollup_time_idx on capability_soh_rollup (capability_rollup_time);

create table if not exists capability_station_soh_uuids(
  capability_rollup_id uuid not null
    constraint capability_station_soh_uuids_capability_soh_rollup
      references capability_soh_rollup(id),
  station_soh_id uuid not null
);

CREATE INDEX capability_station_soh_uuids_capability_rollup_id_idx on capability_station_soh_uuids (capability_rollup_id);

create table if not exists capability_station_soh_status_map(
  capability_rollup_id uuid not null
    constraint capability_station_soh_status_map_capability_soh_rollup
      references capability_soh_rollup(id),
  station_name varchar(255) not null
    constraint capability_station_soh_status_map_station
     references station(name),
   soh_status public.soh_status_enum not null
);

CREATE INDEX capability_station_soh_status_map_capability_rollup_id_idx on capability_station_soh_status_map (capability_rollup_id);

create table if not exists system_message(
    id uuid not null
     constraint system_message_pkey primary key,
    time timestamp not null,
    message text not null,
    system_message_type public.system_message_type_enum not null,
    system_message_severity public.system_message_severity_enum not null,
    system_message_category public.system_message_category_enum not null,
    system_message_sub_category public.system_message_sub_category_enum not null,
    messageTags jsonb
);

create or replace procedure public.delete_stale_records(acei_ttl_in_hours int, rsdf_ttl_in_hours int, ssoh_ttl_in_hours int)
language plpgsql as
$$
  declare
    num_analog_acei_deleted int;
    num_boolean_acei_deleted int;
    num_rsdfs_deleted int;
    num_station_soh_deleted int;

    analog_acei_elapsed_time double precision;
    boolean_acei_elapsed_time double precision;
    rsdf_elapsed_time double precision;
    ssoh_elapsed_time double precision;
    procedure_elapsed_time double precision;

    procedure_start_time timestamptz;
    procedure_end_time timestamptz;
    analog_acei_removal_start_time timestamptz;
    analog_acei_removal_end_time timestamptz;
    boolean_acei_removal_start_time timestamptz;
    boolean_acei_removal_end_time timestamptz;
    rsdf_removal_start_time timestamptz;
    rsdf_removal_end_time timestamptz;
    ssoh_removal_start_time timestamptz;
    ssoh_removal_end_time timestamptz;

    ttl_time timestamp;
  begin
    raise notice 'TTL worker started';

    procedure_start_time := clock_timestamp();

    ttl_time := now() - (acei_ttl_in_hours || ' hours')::interval;
    raise notice 'Deleting analog ACEI with end_time before %', ttl_time;
    analog_acei_removal_start_time := clock_timestamp();
    with analog_deleted as (delete from gms_soh.channel_env_issue_analog where end_time < ttl_time returning *) select count(*) from analog_deleted into num_analog_acei_deleted;
    analog_acei_removal_end_time := clock_timestamp();
    analog_acei_elapsed_time := 1000 * ( extract(epoch from analog_acei_removal_end_time) - extract(epoch from analog_acei_removal_start_time) );
    raise notice 'Deleted % analog ACEI in % ms', num_analog_acei_deleted, analog_acei_elapsed_time;

    raise notice 'Deleting boolean ACEI with end_time before %', ttl_time;
    boolean_acei_removal_start_time := clock_timestamp();
    with boolean_deleted as (delete from gms_soh.channel_env_issue_boolean where end_time < ttl_time returning *) select count(*) from boolean_deleted into num_boolean_acei_deleted;
    boolean_acei_removal_end_time := clock_timestamp();
    boolean_acei_elapsed_time := 1000 * ( extract(epoch from boolean_acei_removal_end_time) - extract(epoch from boolean_acei_removal_start_time) );
    raise notice 'Deleted % boolean ACEI in % ms', num_boolean_acei_deleted, boolean_acei_elapsed_time;

    ttl_time := now() - (rsdf_ttl_in_hours || ' hours')::interval;
    raise notice 'Deleting RSDFs with reception_time before %', ttl_time;
    rsdf_removal_start_time := clock_timestamp();
    with rsdfs_deleted as (delete from gms_soh.raw_station_data_frame where reception_time < ttl_time returning *) select count(*) from rsdfs_deleted into num_rsdfs_deleted;
    rsdf_removal_end_time := clock_timestamp();
    rsdf_elapsed_time := 1000 * ( extract(epoch from rsdf_removal_end_time) - extract(epoch from rsdf_removal_start_time) );
    raise notice 'Deleted % RSDFs in % ms', num_rsdfs_deleted, rsdf_elapsed_time;

    ttl_time := now() - (ssoh_ttl_in_hours || ' hours')::interval;
    raise notice 'Deleting Station SOH with creation_time before %', ttl_time;
    ssoh_removal_start_time := clock_timestamp();
    with station_soh_deleted as (delete from gms_soh.station_soh where creation_time < ttl_time returning *) select count(*) from station_soh_deleted into num_station_soh_deleted;
    ssoh_removal_end_time := clock_timestamp();
    ssoh_elapsed_time := 1000 * ( extract(epoch from ssoh_removal_end_time) - extract(epoch from ssoh_removal_start_time) );
    raise notice 'Deleted % Station SOH in % ms', num_station_soh_deleted, ssoh_elapsed_time;

    procedure_end_time := clock_timestamp();
    procedure_elapsed_time := 1000 * ( extract(epoch from procedure_end_time) - extract(epoch from procedure_start_time) );

    raise notice 'TTL worker finished in % ms', procedure_elapsed_time;
  end
$$;

-- Set gms_admin user for system to use with database
revoke all on schema gms_soh from gms_admin;
grant usage on schema gms_soh to gms_admin;
grant usage on sequence channel_configured_inputs_sequence to gms_admin;
grant usage on sequence reference_site_sequence to gms_admin;
grant usage on sequence reference_site_membership_sequence to gms_admin;
grant usage on sequence reference_network_sequence to gms_admin;
grant usage on sequence reference_channel_sequence to gms_admin;
grant usage on sequence reference_digitizer_sequence to gms_admin;
grant usage on sequence reference_calibration_sequence to gms_admin;
grant usage on sequence reference_station_sequence to gms_admin;
grant usage on sequence reference_source_response_sequence to gms_admin;
grant usage on sequence transferred_rsdf_sequence to gms_admin;
grant usage on sequence transferred_file_sequence to gms_admin;
grant usage on sequence transferred_file_invoice_sequence to gms_admin;
grant usage on sequence station_soh_issue_sequence to gms_admin;
grant usage on sequence calibration_sequence to gms_admin;
grant usage on sequence frequency_amplitude_phase_sequence to gms_admin;
grant usage on sequence waveform_summary_sequence to gms_admin;
grant select, insert, update, delete, truncate, references on all tables in schema gms_soh to gms_admin;
grant usage, select, update on all sequences in schema gms_soh to gms_admin;
revoke all on schema gms_soh_test from gms_admin;
grant usage on schema gms_soh_test to gms_admin;

-- TODO (sgk 1/24/2020) revisit testing user strategy
create role gms_soh_test_application with noinherit login encrypted password 'GMS_POSTGRES_SOH_TEST_APPLICATION_PASSWORD';

revoke all on schema gms_soh from gms_soh_test_application;
grant all on schema gms_soh_test to gms_soh_test_application;

-- set up gms_soh_application user for hibernate to use to connect to the soh database
create role gms_soh_application with noinherit login encrypted password 'GMS_POSTGRES_SOH_APPLICATION_PASSWORD';

grant usage on schema gms_soh to gms_soh_application;
grant usage on sequence channel_configured_inputs_sequence to gms_soh_application;
grant usage on sequence reference_site_sequence to gms_soh_application;
grant usage on sequence reference_site_membership_sequence to gms_soh_application;
grant usage on sequence reference_network_sequence to gms_soh_application;
grant usage on sequence reference_channel_sequence to gms_soh_application;
grant usage on sequence reference_digitizer_sequence to gms_soh_application;
grant usage on sequence reference_calibration_sequence to gms_soh_application;
grant usage on sequence reference_station_sequence to gms_soh_application;
grant usage on sequence reference_source_response_sequence to gms_soh_application;
grant usage on sequence transferred_rsdf_sequence to gms_soh_application;
grant usage on sequence transferred_file_sequence to gms_soh_application;
grant usage on sequence transferred_file_invoice_sequence to gms_soh_application;
grant usage on sequence station_soh_issue_sequence to gms_soh_application;
grant usage on sequence calibration_sequence to gms_soh_application;
grant usage on sequence frequency_amplitude_phase_sequence to gms_soh_application;
grant usage on sequence waveform_summary_sequence to gms_soh_application;
grant select, insert, update on all tables in schema gms_soh to gms_soh_application;
grant delete on capability_soh_rollup to gms_soh_application;
grant delete on capability_station_soh_uuids to gms_soh_application;
grant delete on capability_station_soh_status_map to gms_soh_application;
grant delete on channel_env_issue_boolean to gms_soh_application;
grant delete on channel_env_issue_analog to gms_soh_application;
grant delete on workspace_layout to gms_soh_application;
grant delete on audible_notification to gms_soh_application;
grant delete on workspace_layout_supported_ui_modes to gms_soh_application;
grant delete on station_group_stations to gms_soh_application;
grant delete on soh_status_change_event to gms_soh_application;
grant delete on soh_status_change_collection to gms_soh_application;

grant usage on sequence channel_configured_inputs_sequence to gms_soh_application;
grant usage on sequence reference_site_sequence to gms_soh_application;
grant usage on sequence reference_site_membership_sequence to gms_soh_application;
grant usage on sequence reference_network_sequence to gms_soh_application;
grant usage on sequence reference_channel_sequence to gms_soh_application;
grant usage on sequence reference_digitizer_sequence to gms_soh_application;
grant usage on sequence reference_calibration_sequence to gms_soh_application;
grant usage on sequence reference_station_sequence to gms_soh_application;
grant usage on sequence reference_source_response_sequence to gms_soh_application;
grant usage on sequence transferred_rsdf_sequence to gms_soh_application;
grant usage on sequence transferred_file_sequence to gms_soh_application;
grant usage on sequence transferred_file_invoice_sequence to gms_soh_application;
grant usage on sequence station_soh_issue_sequence to gms_soh_application;
grant usage on sequence calibration_sequence to gms_soh_application;
grant usage on sequence frequency_amplitude_phase_sequence to gms_soh_application;
grant usage on sequence waveform_summary_sequence to gms_soh_application;
grant usage on sequence smvs_sequence to gms_soh_application;
grant usage on sequence station_soh_sequence to gms_soh_application;	
grant usage on sequence channel_soh_sequence to gms_soh_application;
grant usage on sequence station_aggregate_sequence to gms_soh_application;
	
-- set up ttl user
create role gms_soh_ttl_application with noinherit login encrypted password 'GMS_POSTGRES_SOH_TTL_APPLICATION_PASSWORD';

revoke all on schema gms_soh from gms_soh_ttl_application;
grant usage on schema gms_soh to gms_soh_ttl_application;
grant select, delete, update on soh_monitor_value_status to gms_soh_ttl_application;
grant select, delete, update on channel_soh to gms_soh_ttl_application;
grant select, delete, update on station_aggregate to gms_soh_ttl_application;
grant select, delete, update on station_soh to gms_soh_ttl_application;
-- begin set grants on partitions of station_soh
grant select, delete, update on station_soh_akasg to gms_soh_ttl_application;
grant select, delete, update on station_soh_anmo to gms_soh_ttl_application;
grant select, delete, update on station_soh_bdfb to gms_soh_ttl_application;
grant select, delete, update on station_soh_bjt to gms_soh_ttl_application;
grant select, delete, update on station_soh_bvar to gms_soh_ttl_application;
grant select, delete, update on station_soh_elk to gms_soh_ttl_application;
grant select, delete, update on station_soh_esdc to gms_soh_ttl_application;
grant select, delete, update on station_soh_geres to gms_soh_ttl_application;
grant select, delete, update on station_soh_geyt to gms_soh_ttl_application;
grant select, delete, update on station_soh_gumo to gms_soh_ttl_application;
grant select, delete, update on station_soh_h01w to gms_soh_ttl_application;
grant select, delete, update on station_soh_h03n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h03s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h04n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h04s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h05n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h05s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h06e to gms_soh_ttl_application;
grant select, delete, update on station_soh_h06n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h06s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h07n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h07s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h09n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h09w to gms_soh_ttl_application;
grant select, delete, update on station_soh_i03au to gms_soh_ttl_application;
grant select, delete, update on station_soh_i05au to gms_soh_ttl_application;
grant select, delete, update on station_soh_i06au to gms_soh_ttl_application;
grant select, delete, update on station_soh_i07au to gms_soh_ttl_application;
grant select, delete, update on station_soh_i08bo to gms_soh_ttl_application;
grant select, delete, update on station_soh_i09br to gms_soh_ttl_application;
grant select, delete, update on station_soh_i10ca to gms_soh_ttl_application;
grant select, delete, update on station_soh_i11cv to gms_soh_ttl_application;
grant select, delete, update on station_soh_i13cl to gms_soh_ttl_application;
grant select, delete, update on station_soh_i17ci to gms_soh_ttl_application;
grant select, delete, update on station_soh_i18dk to gms_soh_ttl_application;
grant select, delete, update on station_soh_i19dj to gms_soh_ttl_application;
grant select, delete, update on station_soh_i20ec to gms_soh_ttl_application;
grant select, delete, update on station_soh_i21fr to gms_soh_ttl_application;
grant select, delete, update on station_soh_i22fr to gms_soh_ttl_application;
grant select, delete, update on station_soh_i23fr to gms_soh_ttl_application;
grant select, delete, update on station_soh_i24fr to gms_soh_ttl_application;
grant select, delete, update on station_soh_i27de to gms_soh_ttl_application;
grant select, delete, update on station_soh_i30jp to gms_soh_ttl_application;
grant select, delete, update on station_soh_i32ke to gms_soh_ttl_application;
grant select, delete, update on station_soh_i33mg to gms_soh_ttl_application;
grant select, delete, update on station_soh_i34mn to gms_soh_ttl_application;
grant select, delete, update on station_soh_i35na to gms_soh_ttl_application;
grant select, delete, update on station_soh_i36nz to gms_soh_ttl_application;
grant select, delete, update on station_soh_i37no to gms_soh_ttl_application;
grant select, delete, update on station_soh_i39pw to gms_soh_ttl_application;
grant select, delete, update on station_soh_i40pg to gms_soh_ttl_application;
grant select, delete, update on station_soh_i41py to gms_soh_ttl_application;
grant select, delete, update on station_soh_i42pt to gms_soh_ttl_application;
grant select, delete, update on station_soh_i43ru to gms_soh_ttl_application;
grant select, delete, update on station_soh_i44ru to gms_soh_ttl_application;
grant select, delete, update on station_soh_i45ru to gms_soh_ttl_application;
grant select, delete, update on station_soh_i46ru to gms_soh_ttl_application;
grant select, delete, update on station_soh_i47za to gms_soh_ttl_application;
grant select, delete, update on station_soh_i48tn to gms_soh_ttl_application;
grant select, delete, update on station_soh_i49gb to gms_soh_ttl_application;
grant select, delete, update on station_soh_i50gb to gms_soh_ttl_application;
grant select, delete, update on station_soh_i51gb to gms_soh_ttl_application;
grant select, delete, update on station_soh_i52gb to gms_soh_ttl_application;
grant select, delete, update on station_soh_i53us to gms_soh_ttl_application;
grant select, delete, update on station_soh_i55us to gms_soh_ttl_application;
grant select, delete, update on station_soh_i56us to gms_soh_ttl_application;
grant select, delete, update on station_soh_i57us to gms_soh_ttl_application;
grant select, delete, update on station_soh_nna to gms_soh_ttl_application;
grant select, delete, update on station_soh_i58us to gms_soh_ttl_application;
grant select, delete, update on station_soh_i59us to gms_soh_ttl_application;
grant select, delete, update on station_soh_i60us to gms_soh_ttl_application;
grant select, delete, update on station_soh_kbz to gms_soh_ttl_application;
grant select, delete, update on station_soh_kdak to gms_soh_ttl_application;
grant select, delete, update on station_soh_kest to gms_soh_ttl_application;
grant select, delete, update on station_soh_kmbo to gms_soh_ttl_application;
grant select, delete, update on station_soh_maw to gms_soh_ttl_application;
grant select, delete, update on station_soh_mjar to gms_soh_ttl_application;
grant select, delete, update on station_soh_new to gms_soh_ttl_application;
grant select, delete, update on station_soh_nrik to gms_soh_ttl_application;
grant select, delete, update on station_soh_nvar to gms_soh_ttl_application;
grant select, delete, update on station_soh_petk to gms_soh_ttl_application;
grant select, delete, update on station_soh_pfo to gms_soh_ttl_application;
grant select, delete, update on station_soh_pmsa to gms_soh_ttl_application;
grant select, delete, update on station_soh_ppt to gms_soh_ttl_application;
grant select, delete, update on station_soh_qspa to gms_soh_ttl_application;
grant select, delete, update on station_soh_rosc to gms_soh_ttl_application;
grant select, delete, update on station_soh_schq to gms_soh_ttl_application;
grant select, delete, update on station_soh_sjg to gms_soh_ttl_application;
grant select, delete, update on station_soh_sonm to gms_soh_ttl_application;
grant select, delete, update on station_soh_tkl to gms_soh_ttl_application;
grant select, delete, update on station_soh_tord to gms_soh_ttl_application;
grant select, delete, update on station_soh_ulm to gms_soh_ttl_application;
grant select, delete, update on station_soh_usrk to gms_soh_ttl_application;
grant select, delete, update on station_soh_wra to gms_soh_ttl_application;
grant select, delete, update on station_soh_ybh to gms_soh_ttl_application;
grant select, delete, update on station_soh_yka to gms_soh_ttl_application;
grant select, delete, update on station_soh_zalv to gms_soh_ttl_application;
grant select, delete, update on station_soh_aak to gms_soh_ttl_application;
grant select, delete, update on station_soh_akto to gms_soh_ttl_application;
grant select, delete, update on station_soh_arces to gms_soh_ttl_application;
grant select, delete, update on station_soh_arti to gms_soh_ttl_application;
grant select, delete, update on station_soh_asf to gms_soh_ttl_application;
grant select, delete, update on station_soh_bati to gms_soh_ttl_application;
grant select, delete, update on station_soh_belg to gms_soh_ttl_application;
grant select, delete, update on station_soh_borg to gms_soh_ttl_application;
grant select, delete, update on station_soh_brdh to gms_soh_ttl_application;
grant select, delete, update on station_soh_brmar to gms_soh_ttl_application;
grant select, delete, update on station_soh_brtr to gms_soh_ttl_application;
grant select, delete, update on station_soh_cmar to gms_soh_ttl_application;
grant select, delete, update on station_soh_dav to gms_soh_ttl_application;
grant select, delete, update on station_soh_davox to gms_soh_ttl_application;
grant select, delete, update on station_soh_eil to gms_soh_ttl_application;
grant select, delete, update on station_soh_fines to gms_soh_ttl_application;
grant select, delete, update on station_soh_gni to gms_soh_ttl_application;
grant select, delete, update on station_soh_hfs to gms_soh_ttl_application;
grant select, delete, update on station_soh_idi to gms_soh_ttl_application;
grant select, delete, update on station_soh_jay to gms_soh_ttl_application;
grant select, delete, update on station_soh_jcj to gms_soh_ttl_application;
grant select, delete, update on station_soh_jhj to gms_soh_ttl_application;
grant select, delete, update on station_soh_jka to gms_soh_ttl_application;
grant select, delete, update on station_soh_jmic to gms_soh_ttl_application;
grant select, delete, update on station_soh_jnu to gms_soh_ttl_application;
grant select, delete, update on station_soh_jow to gms_soh_ttl_application;
grant select, delete, update on station_soh_kapi to gms_soh_ttl_application;
grant select, delete, update on station_soh_kirv to gms_soh_ttl_application;
grant select, delete, update on station_soh_klr to gms_soh_ttl_application;
grant select, delete, update on station_soh_ksrs to gms_soh_ttl_application;
grant select, delete, update on station_soh_kurk to gms_soh_ttl_application;
grant select, delete, update on station_soh_kvar to gms_soh_ttl_application;
grant select, delete, update on station_soh_lem to gms_soh_ttl_application;
grant select, delete, update on station_soh_lzdm to gms_soh_ttl_application;
grant select, delete, update on station_soh_ma2 to gms_soh_ttl_application;
grant select, delete, update on station_soh_mdp to gms_soh_ttl_application;
grant select, delete, update on station_soh_mkar to gms_soh_ttl_application;
grant select, delete, update on station_soh_mlr to gms_soh_ttl_application;
grant select, delete, update on station_soh_mmai to gms_soh_ttl_application;
grant select, delete, update on station_soh_noa to gms_soh_ttl_application;
grant select, delete, update on station_soh_obn to gms_soh_ttl_application;
grant select, delete, update on station_soh_palk to gms_soh_ttl_application;
grant select, delete, update on station_soh_psi to gms_soh_ttl_application;
grant select, delete, update on station_soh_sey to gms_soh_ttl_application;
grant select, delete, update on station_soh_sfjd to gms_soh_ttl_application;
grant select, delete, update on station_soh_siji to gms_soh_ttl_application;
grant select, delete, update on station_soh_spits to gms_soh_ttl_application;
grant select, delete, update on station_soh_tgy to gms_soh_ttl_application;
grant select, delete, update on station_soh_tixi to gms_soh_ttl_application;
grant select, delete, update on station_soh_tly to gms_soh_ttl_application;
grant select, delete, update on station_soh_vae to gms_soh_ttl_application;
grant select, delete, update on station_soh_vrac to gms_soh_ttl_application;
grant select, delete, update on station_soh_wsar to gms_soh_ttl_application;
grant select, delete, update on station_soh_yak to gms_soh_ttl_application;
grant select, delete, update on station_soh_asar to gms_soh_ttl_application;
grant select, delete, update on station_soh_bosa to gms_soh_ttl_application;
grant select, delete, update on station_soh_cpup to gms_soh_ttl_application;
grant select, delete, update on station_soh_dbic to gms_soh_ttl_application;
grant select, delete, update on station_soh_h08n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h08s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h10n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h10s to gms_soh_ttl_application;
grant select, delete, update on station_soh_h11n to gms_soh_ttl_application;
grant select, delete, update on station_soh_h11s to gms_soh_ttl_application;
grant select, delete, update on station_soh_i02ar to gms_soh_ttl_application;
grant select, delete, update on station_soh_ilar to gms_soh_ttl_application;
grant select, delete, update on station_soh_lbtb to gms_soh_ttl_application;
grant select, delete, update on station_soh_lpaz to gms_soh_ttl_application;
grant select, delete, update on station_soh_pdar to gms_soh_ttl_application;
grant select, delete, update on station_soh_plca to gms_soh_ttl_application;
grant select, delete, update on station_soh_txar to gms_soh_ttl_application;
grant select, delete, update on station_soh_vnda to gms_soh_ttl_application;
grant select, delete, update on station_soh_afi to gms_soh_ttl_application;
grant select, delete, update on station_soh_apg to gms_soh_ttl_application;
grant select, delete, update on station_soh_atah to gms_soh_ttl_application;
grant select, delete, update on station_soh_atd to gms_soh_ttl_application;
grant select, delete, update on station_soh_bbb to gms_soh_ttl_application;
grant select, delete, update on station_soh_bbts to gms_soh_ttl_application;
grant select, delete, update on station_soh_cfa to gms_soh_ttl_application;
grant select, delete, update on station_soh_cmig to gms_soh_ttl_application;
grant select, delete, update on station_soh_cta to gms_soh_ttl_application;
grant select, delete, update on station_soh_dlbc to gms_soh_ttl_application;
grant select, delete, update on station_soh_dzm to gms_soh_ttl_application;
grant select, delete, update on station_soh_eka to gms_soh_ttl_application;
grant select, delete, update on station_soh_fitz to gms_soh_ttl_application;
grant select, delete, update on station_soh_frb to gms_soh_ttl_application;
grant select, delete, update on station_soh_furi to gms_soh_ttl_application;
grant select, delete, update on station_soh_hnr to gms_soh_ttl_application;
grant select, delete, update on station_soh_ink to gms_soh_ttl_application;
grant select, delete, update on station_soh_jts to gms_soh_ttl_application;
grant select, delete, update on station_soh_kowa to gms_soh_ttl_application;
grant select, delete, update on station_soh_krvt to gms_soh_ttl_application;
grant select, delete, update on station_soh_lpig to gms_soh_ttl_application;
grant select, delete, update on station_soh_lsz to gms_soh_ttl_application;
grant select, delete, update on station_soh_lvc to gms_soh_ttl_application;
grant select, delete, update on station_soh_matp to gms_soh_ttl_application;
grant select, delete, update on station_soh_mbar to gms_soh_ttl_application;
grant select, delete, update on station_soh_mdt to gms_soh_ttl_application;
grant select, delete, update on station_soh_msku to gms_soh_ttl_application;
grant select, delete, update on station_soh_msvf to gms_soh_ttl_application;
grant select, delete, update on station_soh_nwao to gms_soh_ttl_application;
grant select, delete, update on station_soh_opo to gms_soh_ttl_application;
grant select, delete, update on station_soh_pcrv to gms_soh_ttl_application;
grant select, delete, update on station_soh_pmg to gms_soh_ttl_application;
grant select, delete, update on station_soh_ptga to gms_soh_ttl_application;
grant select, delete, update on station_soh_rao to gms_soh_ttl_application;
grant select, delete, update on station_soh_rar to gms_soh_ttl_application;
grant select, delete, update on station_soh_rcbr to gms_soh_ttl_application;
grant select, delete, update on station_soh_res to gms_soh_ttl_application;
grant select, delete, update on station_soh_rpn to gms_soh_ttl_application;
grant select, delete, update on station_soh_rpz to gms_soh_ttl_application;
grant select, delete, update on station_soh_sado to gms_soh_ttl_application;
grant select, delete, update on station_soh_sdv to gms_soh_ttl_application;
grant select, delete, update on station_soh_shem to gms_soh_ttl_application;
grant select, delete, update on station_soh_siv to gms_soh_ttl_application;
grant select, delete, update on station_soh_snaa to gms_soh_ttl_application;
grant select, delete, update on station_soh_sur to gms_soh_ttl_application;
grant select, delete, update on station_soh_teig to gms_soh_ttl_application;
grant select, delete, update on station_soh_tsum to gms_soh_ttl_application;
grant select, delete, update on station_soh_urz to gms_soh_ttl_application;
grant select, delete, update on station_soh_usha to gms_soh_ttl_application;
-- end set grants on partitions of station_soh
-- keep grant statement for station_soh_default
grant select, delete, update on station_soh_default to gms_soh_ttl_application;
grant select, delete, update on soh_status_change_event to gms_soh_ttl_application;
grant select, delete, update on soh_status_change_quieted to gms_soh_ttl_application;
grant select, delete, update on soh_status_change_collection to gms_soh_ttl_application;
grant select, delete, update on channel_env_issue_analog to gms_soh_ttl_application;
grant select, delete, update on channel_env_issue_boolean to gms_soh_ttl_application;
grant select, delete, update on raw_station_data_frame to gms_soh_ttl_application;
grant select, delete, update on raw_station_data_frame_channel_names to gms_soh_ttl_application;
grant select, delete, update on capability_soh_rollup to gms_soh_ttl_application;
grant select, delete, update on capability_station_soh_uuids to gms_soh_ttl_application;
grant select, delete, update on capability_station_soh_status_map to gms_soh_ttl_application;





grant usage on sequence channel_configured_inputs_sequence to gms_soh_ttl_application;
grant usage on sequence frequency_amplitude_phase_sequence to gms_soh_ttl_application;	
grant usage on sequence reference_site_sequence to gms_soh_ttl_application;
grant usage on sequence reference_site_membership_sequence to gms_soh_ttl_application;
grant usage on sequence reference_network_sequence to gms_soh_ttl_application;
grant usage on sequence reference_channel_sequence to gms_soh_ttl_application;
grant usage on sequence reference_digitizer_sequence to gms_soh_ttl_application;
grant usage on sequence reference_calibration_sequence to gms_soh_ttl_application;
grant usage on sequence reference_station_sequence to gms_soh_ttl_application;
grant usage on sequence reference_source_response_sequence to gms_soh_ttl_application;
grant usage on sequence transferred_rsdf_sequence to gms_soh_ttl_application;
grant usage on sequence transferred_file_sequence to gms_soh_ttl_application;
grant usage on sequence transferred_file_invoice_sequence to gms_soh_ttl_application;
grant usage on sequence station_soh_issue_sequence to gms_soh_ttl_application;
grant usage on sequence calibration_sequence to gms_soh_ttl_application;
grant usage on sequence station_aggregate_sequence to gms_soh_ttl_application;
grant usage on sequence smvs_sequence to gms_soh_ttl_application;
grant usage on sequence channel_soh_sequence to gms_soh_ttl_application;
grant usage on sequence station_soh_sequence to gms_soh_ttl_application;
grant usage on sequence waveform_summary_sequence to gms_soh_ttl_application;
	
-- set up gms_read_only user for developers to use to connect to the database
revoke all on schema gms_soh from gms_read_only;
grant usage on schema gms_soh to gms_read_only;
grant select on all tables in schema gms_soh to gms_read_only;

-- Change ownership of all the tables to gms_admin

alter schema gms_soh owner to gms_admin;
alter sequence channel_configured_inputs_sequence owner to gms_admin;
alter sequence reference_site_sequence owner to gms_admin;
alter sequence reference_site_membership_sequence owner to gms_admin;
alter sequence reference_network_sequence owner to gms_admin;
alter sequence reference_channel_sequence owner to gms_admin;
alter sequence reference_digitizer_sequence owner to gms_admin;
alter sequence reference_calibration_sequence owner to gms_admin;
alter sequence reference_station_sequence owner to gms_admin;
alter sequence reference_source_response_sequence owner to gms_admin;
alter sequence transferred_rsdf_sequence owner to gms_admin;
alter sequence transferred_file_sequence owner to gms_admin;
alter sequence transferred_file_invoice_sequence owner to gms_admin;
alter sequence station_soh_issue_sequence owner to gms_admin;
alter sequence calibration_sequence owner to gms_admin;
alter sequence frequency_amplitude_phase_sequence owner to gms_admin;
alter sequence waveform_summary_sequence owner to gms_admin;
alter sequence channel_soh_sequence owner to gms_admin;
alter sequence smvs_sequence owner to gms_admin;
alter sequence station_aggregate_sequence owner to gms_admin;
alter sequence station_soh_sequence owner to gms_admin;
alter table acquisition_soh_status owner to gms_admin;
alter table calibration owner to gms_admin;
alter table channel owner to gms_admin;
alter table channel_configured_inputs owner to gms_admin;
alter table channel_env_issue_analog owner to gms_admin;
alter table channel_env_issue_boolean owner to gms_admin;
alter table environment_soh_status owner to gms_admin;
alter table environment_soh_counts_by_type owner to gms_admin;
alter table environment_soh_status_summaries owner to gms_admin;
alter table frequency_amplitude_phase owner to gms_admin;
alter table raw_station_data_frame owner to gms_admin;
alter table raw_station_data_frame_channel_names owner to gms_admin;
alter table reference_alias owner to gms_admin;
alter table reference_calibration owner to gms_admin;
alter table reference_calibration_calibrations owner to gms_admin;
alter table reference_channel owner to gms_admin;
alter table reference_channel_aliases owner to gms_admin;
alter table reference_digitizer owner to gms_admin;
alter table reference_digitizer_membership owner to gms_admin;
alter table reference_network owner to gms_admin;
alter table reference_network_membership owner to gms_admin;
alter table reference_response owner to gms_admin;
alter table reference_response_frequency_amplitude_phase owner to gms_admin;
alter table reference_response_reference_calibrations owner to gms_admin;
alter table reference_sensor owner to gms_admin;
alter table reference_site owner to gms_admin;
alter table reference_site_aliases owner to gms_admin;
alter table reference_site_membership owner to gms_admin;
alter table reference_source_response owner to gms_admin;
alter table reference_response_reference_source_response owner to gms_admin;
alter table reference_source_response_information_sources owner to gms_admin;
alter table reference_station owner to gms_admin;
alter table reference_station_aliases owner to gms_admin;
alter table reference_station_membership owner to gms_admin;
alter table response owner to gms_admin;
alter table response_calibrations owner to gms_admin;
alter table response_frequency_amplitude_phase owner to gms_admin;
alter table soh_status owner to gms_admin;
alter table station owner to gms_admin;
alter table channel_group owner to gms_admin;
alter table channel_group_channels owner to gms_admin;
alter table station_channel_info owner to gms_admin;
alter table soh_status_change_quieted owner to gms_admin;
alter table station_group owner to gms_admin;
alter table station_group_soh_status owner to gms_admin;
alter table station_group_stations owner to gms_admin;
alter table station_soh_issue owner to gms_admin;
alter table station_soh_status owner to gms_admin;
alter table channel_soh_status owner to gms_admin;
alter table transferred_file owner to gms_admin;
alter table transferred_file_invoice owner to gms_admin;
alter table transferred_file_raw_station_data_frame owner to gms_admin;
alter table transferred_file_rsdf_metadata_channel_names owner to gms_admin;
alter table user_preferences owner to gms_admin;
alter table workspace_layout owner to gms_admin;
alter table audible_notification owner to gms_admin;
alter table workspace_layout_supported_ui_modes owner to gms_admin;
alter table waveform_summary owner to gms_admin;
alter table channel_soh owner to gms_admin;
alter table soh_monitor_value_status owner to gms_admin;
alter table station_aggregate owner to gms_admin;
alter table station_soh owner to gms_admin;
-- begin set owner on partitions of station_soh
alter table station_soh_afi owner to gms_admin;
alter table station_soh_anmo owner to gms_admin;
alter table station_soh_apg owner to gms_admin;
alter table station_soh_asar owner to gms_admin;
alter table station_soh_atah owner to gms_admin;
alter table station_soh_atd owner to gms_admin;
alter table station_soh_bbb owner to gms_admin;
alter table station_soh_bbts owner to gms_admin;
alter table station_soh_bdfb owner to gms_admin;
alter table station_soh_bosa owner to gms_admin;
alter table station_soh_cfa owner to gms_admin;
alter table station_soh_cmig owner to gms_admin;
alter table station_soh_cpup owner to gms_admin;
alter table station_soh_cta owner to gms_admin;
alter table station_soh_dbic owner to gms_admin;
alter table station_soh_dlbc owner to gms_admin;
alter table station_soh_dzm owner to gms_admin;
alter table station_soh_eka owner to gms_admin;
alter table station_soh_elk owner to gms_admin;
alter table station_soh_fitz owner to gms_admin;
alter table station_soh_frb owner to gms_admin;
alter table station_soh_furi owner to gms_admin;
alter table station_soh_gumo owner to gms_admin;
alter table station_soh_h01w owner to gms_admin;
alter table station_soh_h03n owner to gms_admin;
alter table station_soh_h03s owner to gms_admin;
alter table station_soh_h06e owner to gms_admin;
alter table station_soh_h06n owner to gms_admin;
alter table station_soh_h06s owner to gms_admin;
alter table station_soh_h08n owner to gms_admin;
alter table station_soh_h08s owner to gms_admin;
alter table station_soh_h10n owner to gms_admin;
alter table station_soh_h10s owner to gms_admin;
alter table station_soh_h11n owner to gms_admin;
alter table station_soh_h11s owner to gms_admin;
alter table station_soh_hnr owner to gms_admin;
alter table station_soh_i02ar owner to gms_admin;
alter table station_soh_i03au owner to gms_admin;
alter table station_soh_i05au owner to gms_admin;
alter table station_soh_i06au owner to gms_admin;
alter table station_soh_i07au owner to gms_admin;
alter table station_soh_i08bo owner to gms_admin;
alter table station_soh_i09br owner to gms_admin;
alter table station_soh_i10ca owner to gms_admin;
alter table station_soh_i11cv owner to gms_admin;
alter table station_soh_i13cl owner to gms_admin;
alter table station_soh_i17ci owner to gms_admin;
alter table station_soh_i18dk owner to gms_admin;
alter table station_soh_i19dj owner to gms_admin;
alter table station_soh_i20ec owner to gms_admin;
alter table station_soh_i22fr owner to gms_admin;
alter table station_soh_i24fr owner to gms_admin;
alter table station_soh_i32ke owner to gms_admin;
alter table station_soh_i33mg owner to gms_admin;
alter table station_soh_i35na owner to gms_admin;
alter table station_soh_i36nz owner to gms_admin;
alter table station_soh_i39pw owner to gms_admin;
alter table station_soh_i40pg owner to gms_admin;
alter table station_soh_i41py owner to gms_admin;
alter table station_soh_i42pt owner to gms_admin;
alter table station_soh_i47za owner to gms_admin;
alter table station_soh_i48tn owner to gms_admin;
alter table station_soh_i49gb owner to gms_admin;
alter table station_soh_i50gb owner to gms_admin;
alter table station_soh_i53us owner to gms_admin;
alter table station_soh_i55us owner to gms_admin;
alter table station_soh_i56us owner to gms_admin;
alter table station_soh_i57us owner to gms_admin;
alter table station_soh_i58us owner to gms_admin;
alter table station_soh_i59us owner to gms_admin;
alter table station_soh_i60us owner to gms_admin;
alter table station_soh_ilar owner to gms_admin;
alter table station_soh_ink owner to gms_admin;
alter table station_soh_jts owner to gms_admin;
alter table station_soh_kdak owner to gms_admin;
alter table station_soh_kest owner to gms_admin;
alter table station_soh_kmbo owner to gms_admin;
alter table station_soh_kowa owner to gms_admin;
alter table station_soh_krvt owner to gms_admin;
alter table station_soh_lbtb owner to gms_admin;
alter table station_soh_lpaz owner to gms_admin;
alter table station_soh_lpig owner to gms_admin;
alter table station_soh_lsz owner to gms_admin;
alter table station_soh_lvc owner to gms_admin;
alter table station_soh_matp owner to gms_admin;
alter table station_soh_maw owner to gms_admin;
alter table station_soh_mbar owner to gms_admin;
alter table station_soh_mdt owner to gms_admin;
alter table station_soh_msku owner to gms_admin;
alter table station_soh_msvf owner to gms_admin;
alter table station_soh_new owner to gms_admin;
alter table station_soh_nna owner to gms_admin;
alter table station_soh_nvar owner to gms_admin;
alter table station_soh_nwao owner to gms_admin;
alter table station_soh_opo owner to gms_admin;
alter table station_soh_pcrv owner to gms_admin;
alter table station_soh_pdar owner to gms_admin;
alter table station_soh_pfo owner to gms_admin;
alter table station_soh_plca owner to gms_admin;
alter table station_soh_pmg owner to gms_admin;
alter table station_soh_pmsa owner to gms_admin;
alter table station_soh_ppt owner to gms_admin;
alter table station_soh_ptga owner to gms_admin;
alter table station_soh_qspa owner to gms_admin;
alter table station_soh_rao owner to gms_admin;
alter table station_soh_rar owner to gms_admin;
alter table station_soh_rcbr owner to gms_admin;
alter table station_soh_res owner to gms_admin;
alter table station_soh_rosc owner to gms_admin;
alter table station_soh_rpn owner to gms_admin;
alter table station_soh_rpz owner to gms_admin;
alter table station_soh_sado owner to gms_admin;
alter table station_soh_schq owner to gms_admin;
alter table station_soh_sdv owner to gms_admin;
alter table station_soh_shem owner to gms_admin;
alter table station_soh_siv owner to gms_admin;
alter table station_soh_sjg owner to gms_admin;
alter table station_soh_snaa owner to gms_admin;
alter table station_soh_sur owner to gms_admin;
alter table station_soh_teig owner to gms_admin;
alter table station_soh_tkl owner to gms_admin;
alter table station_soh_tord owner to gms_admin;
alter table station_soh_tsum owner to gms_admin;
alter table station_soh_txar owner to gms_admin;
alter table station_soh_ulm owner to gms_admin;
alter table station_soh_urz owner to gms_admin;
alter table station_soh_usha owner to gms_admin;
alter table station_soh_vnda owner to gms_admin;
alter table station_soh_wra owner to gms_admin;
alter table station_soh_ybh owner to gms_admin;
alter table station_soh_yka owner to gms_admin;
alter table station_soh_aak owner to gms_admin;
alter table station_soh_akasg owner to gms_admin;
alter table station_soh_akto owner to gms_admin;
alter table station_soh_arces owner to gms_admin;
alter table station_soh_arti owner to gms_admin;
alter table station_soh_asf owner to gms_admin;
alter table station_soh_bati owner to gms_admin;
alter table station_soh_belg owner to gms_admin;
alter table station_soh_bjt owner to gms_admin;
alter table station_soh_borg owner to gms_admin;
alter table station_soh_brdh owner to gms_admin;
alter table station_soh_brmar owner to gms_admin;
alter table station_soh_brtr owner to gms_admin;
alter table station_soh_bvar owner to gms_admin;
alter table station_soh_cmar owner to gms_admin;
alter table station_soh_dav owner to gms_admin;
alter table station_soh_davox owner to gms_admin;
alter table station_soh_eil owner to gms_admin;
alter table station_soh_esdc owner to gms_admin;
alter table station_soh_fines owner to gms_admin;
alter table station_soh_geres owner to gms_admin;
alter table station_soh_geyt owner to gms_admin;
alter table station_soh_gni owner to gms_admin;
alter table station_soh_h05n owner to gms_admin;
alter table station_soh_h05s owner to gms_admin;
alter table station_soh_h07n owner to gms_admin;
alter table station_soh_h07s owner to gms_admin;
alter table station_soh_h09n owner to gms_admin;
alter table station_soh_h09w owner to gms_admin;
alter table station_soh_hfs owner to gms_admin;
alter table station_soh_idi owner to gms_admin;
alter table station_soh_jay owner to gms_admin;
alter table station_soh_jcj owner to gms_admin;
alter table station_soh_jhj owner to gms_admin;
alter table station_soh_jka owner to gms_admin;
alter table station_soh_jmic owner to gms_admin;
alter table station_soh_jnu owner to gms_admin;
alter table station_soh_jow owner to gms_admin;
alter table station_soh_kapi owner to gms_admin;
alter table station_soh_kbz owner to gms_admin;
alter table station_soh_kirv owner to gms_admin;
alter table station_soh_klr owner to gms_admin;
alter table station_soh_ksrs owner to gms_admin;
alter table station_soh_kurk owner to gms_admin;
alter table station_soh_kvar owner to gms_admin;
alter table station_soh_lem owner to gms_admin;
alter table station_soh_lzdm owner to gms_admin;
alter table station_soh_ma2 owner to gms_admin;
alter table station_soh_mdp owner to gms_admin;
alter table station_soh_mjar owner to gms_admin;
alter table station_soh_mkar owner to gms_admin;
alter table station_soh_mlr owner to gms_admin;
alter table station_soh_mmai owner to gms_admin;
alter table station_soh_noa owner to gms_admin;
alter table station_soh_nrik owner to gms_admin;
alter table station_soh_obn owner to gms_admin;
alter table station_soh_palk owner to gms_admin;
alter table station_soh_petk owner to gms_admin;
alter table station_soh_psi owner to gms_admin;
alter table station_soh_sey owner to gms_admin;
alter table station_soh_sfjd owner to gms_admin;
alter table station_soh_siji owner to gms_admin;
alter table station_soh_sonm owner to gms_admin;
alter table station_soh_spits owner to gms_admin;
alter table station_soh_tgy owner to gms_admin;
alter table station_soh_tixi owner to gms_admin;
alter table station_soh_tly owner to gms_admin;
alter table station_soh_usrk owner to gms_admin;
alter table station_soh_vae owner to gms_admin;
alter table station_soh_vrac owner to gms_admin;
alter table station_soh_wsar owner to gms_admin;
alter table station_soh_yak owner to gms_admin;
alter table station_soh_zalv owner to gms_admin;
alter table station_soh_h04n owner to gms_admin;
alter table station_soh_h04s owner to gms_admin;
alter table station_soh_i21fr owner to gms_admin;
alter table station_soh_i23fr owner to gms_admin;
alter table station_soh_i34mn owner to gms_admin;
alter table station_soh_i27de owner to gms_admin;
alter table station_soh_i30jp owner to gms_admin;
alter table station_soh_i37no owner to gms_admin;
alter table station_soh_i43ru owner to gms_admin;
alter table station_soh_i44ru owner to gms_admin;
alter table station_soh_i45ru owner to gms_admin;
alter table station_soh_i46ru owner to gms_admin;
alter table station_soh_i51gb owner to gms_admin;
alter table station_soh_i52gb owner to gms_admin;
-- end set owner on partitions of station_soh
-- keep alter statement for station_soh_default
alter table station_soh_default owner to gms_admin;
alter table soh_status_change_event owner to gms_admin;
alter table soh_status_change_collection owner to gms_admin;
alter table capability_soh_rollup owner to gms_admin;
alter table capability_station_soh_uuids owner to gms_admin;
alter table capability_station_soh_status_map owner to gms_admin;
alter table system_message owner to gms_admin;
