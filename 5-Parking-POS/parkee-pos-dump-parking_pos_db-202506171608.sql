--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

-- Started on 2025-06-17 16:08:20 WIB

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3697 (class 1262 OID 96257)
-- Name: parking_pos_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE parking_pos_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';


ALTER DATABASE parking_pos_db OWNER TO postgres;

\connect parking_pos_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3698 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 228 (class 1259 OID 96364)
-- Name: active_members_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.active_members_statistics AS
SELECT
    NULL::bigint AS id,
    NULL::character varying(20) AS member_code,
    NULL::character varying(100) AS name,
    NULL::character varying(20) AS vehicle_plate_number,
    NULL::bigint AS total_parkings,
    NULL::numeric AS total_spent,
    NULL::numeric(10,2) AS current_balance,
    NULL::timestamp without time zone AS last_activity;


ALTER VIEW public.active_members_statistics OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 96285)
-- Name: parking_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parking_tickets (
    id bigint NOT NULL,
    plate_number character varying(20) NOT NULL,
    vehicle_type character varying(20),
    check_in_time timestamp without time zone NOT NULL,
    check_out_time timestamp without time zone,
    check_in_photo_path text,
    check_out_photo_path text,
    check_in_gate character varying(50),
    check_out_gate character varying(50),
    check_in_operator character varying(100),
    check_out_operator character varying(100),
    member_id bigint,
    member_name character varying(100),
    parking_fee numeric(10,2),
    status character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.parking_tickets OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 96355)
-- Name: daily_parking_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_parking_statistics AS
 SELECT date(check_in_time) AS parking_date,
    count(*) AS total_vehicles,
    count(
        CASE
            WHEN ((status)::text = 'ACTIVE'::text) THEN 1
            ELSE NULL::integer
        END) AS active_vehicles,
    count(
        CASE
            WHEN ((status)::text = 'COMPLETED'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_vehicles,
    sum(parking_fee) AS total_revenue,
    avg((EXTRACT(epoch FROM (check_out_time - check_in_time)) / (3600)::numeric)) AS avg_duration_hours
   FROM public.parking_tickets
  GROUP BY (date(check_in_time));


ALTER VIEW public.daily_parking_statistics OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 96258)
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 96335)
-- Name: invoice_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_receipts (
    id bigint NOT NULL,
    invoice_number character varying(50) NOT NULL,
    parking_ticket_id bigint NOT NULL,
    invoice_date timestamp without time zone NOT NULL,
    plate_number character varying(20) NOT NULL,
    check_in_time timestamp without time zone NOT NULL,
    check_out_time timestamp without time zone NOT NULL,
    duration_minutes bigint NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0.00,
    total_amount numeric(10,2) NOT NULL,
    payment_method character varying(30) NOT NULL,
    payment_reference character varying(100),
    status character varying(20) DEFAULT 'PAID'::character varying NOT NULL,
    member_name character varying(100),
    voucher_code character varying(50),
    operator_name character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.invoice_receipts OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 96334)
-- Name: invoice_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_receipts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_receipts_id_seq OWNER TO postgres;

--
-- TOC entry 3699 (class 0 OID 0)
-- Dependencies: 224
-- Name: invoice_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_receipts_id_seq OWNED BY public.invoice_receipts.id;


--
-- TOC entry 217 (class 1259 OID 96268)
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.members (
    id bigint NOT NULL,
    member_code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    vehicle_plate_number character varying(20) NOT NULL,
    email character varying(100),
    phone_number character varying(20),
    balance numeric(10,2) DEFAULT 0.00 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    registered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_activity timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.members OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 96267)
-- Name: members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.members_id_seq OWNER TO postgres;

--
-- TOC entry 3700 (class 0 OID 0)
-- Dependencies: 216
-- Name: members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.members_id_seq OWNED BY public.members.id;


--
-- TOC entry 218 (class 1259 OID 96284)
-- Name: parking_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parking_tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parking_tickets_id_seq OWNER TO postgres;

--
-- TOC entry 3701 (class 0 OID 0)
-- Dependencies: 218
-- Name: parking_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parking_tickets_id_seq OWNED BY public.parking_tickets.id;


--
-- TOC entry 223 (class 1259 OID 96318)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    parking_ticket_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(30) NOT NULL,
    payment_time timestamp without time zone NOT NULL,
    reference_number character varying(100),
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 96360)
-- Name: payment_method_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.payment_method_statistics AS
 SELECT payment_method,
    count(*) AS transaction_count,
    sum(amount) AS total_amount,
    avg(amount) AS avg_amount
   FROM public.payments
  WHERE ((status)::text = 'SUCCESS'::text)
  GROUP BY payment_method
  ORDER BY (count(*)) DESC;


ALTER VIEW public.payment_method_statistics OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 96317)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 222
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 221 (class 1259 OID 96303)
-- Name: vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vouchers (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(200) NOT NULL,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_amount numeric(10,2) DEFAULT 0.00,
    valid_from timestamp without time zone NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    active boolean DEFAULT true NOT NULL,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    terminated_at timestamp without time zone
);


ALTER TABLE public.vouchers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 96302)
-- Name: vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vouchers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vouchers_id_seq OWNER TO postgres;

--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 220
-- Name: vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vouchers_id_seq OWNED BY public.vouchers.id;


--
-- TOC entry 3494 (class 2604 OID 96338)
-- Name: invoice_receipts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_receipts ALTER COLUMN id SET DEFAULT nextval('public.invoice_receipts_id_seq'::regclass);


--
-- TOC entry 3480 (class 2604 OID 96271)
-- Name: members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members ALTER COLUMN id SET DEFAULT nextval('public.members_id_seq'::regclass);


--
-- TOC entry 3484 (class 2604 OID 96288)
-- Name: parking_tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parking_tickets ALTER COLUMN id SET DEFAULT nextval('public.parking_tickets_id_seq'::regclass);


--
-- TOC entry 3491 (class 2604 OID 96321)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 3486 (class 2604 OID 96306)
-- Name: vouchers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers ALTER COLUMN id SET DEFAULT nextval('public.vouchers_id_seq'::regclass);


--
-- TOC entry 3681 (class 0 OID 96258)
-- Dependencies: 215
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	Create tables	SQL	V1__Create_tables.sql	1938713730	postgres	2025-06-17 16:06:10.701054	75	t
\.


--
-- TOC entry 3691 (class 0 OID 96335)
-- Dependencies: 225
-- Data for Name: invoice_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_receipts (id, invoice_number, parking_ticket_id, invoice_date, plate_number, check_in_time, check_out_time, duration_minutes, base_amount, discount_amount, total_amount, payment_method, payment_reference, status, member_name, voucher_code, operator_name, created_at) FROM stdin;
1	INV-202506140001	1	2025-06-14 10:30:00	B1111AAA	2025-06-14 08:00:00	2025-06-14 10:30:00	150	9000.00	0.00	9000.00	Tunai	CS-1718343000001	PAID	\N	\N	Op. Budi	2025-06-17 16:06:10.727045
2	INV-202506140002	2	2025-06-14 11:45:00	B2222BBB	2025-06-14 09:15:00	2025-06-14 11:45:00	150	9000.00	0.00	9000.00	QRIS	QR-1718347500001	PAID	\N	\N	Op. Andi	2025-06-17 16:06:10.727045
3	INV-202506140003	3	2025-06-14 14:00:00	B1234ABC	2025-06-14 10:00:00	2025-06-14 14:00:00	240	12000.00	1200.00	10800.00	Saldo Member	MB-1718355600001	PAID	Budi Santoso	\N	Op. Citra	2025-06-17 16:06:10.727045
4	INV-202506140004	4	2025-06-14 15:00:00	B3333CCC	2025-06-14 11:30:00	2025-06-14 15:00:00	210	12000.00	0.00	12000.00	Flazz BCA	FL-1718359200001	PAID	\N	\N	Op. Dedi	2025-06-17 16:06:10.727045
5	INV-202506140005	5	2025-06-14 16:30:00	B5678DEF	2025-06-14 12:00:00	2025-06-14 16:30:00	270	15000.00	1500.00	13500.00	Saldo Member	MB-1718364600001	PAID	Siti Rahayu	\N	Op. Eka	2025-06-17 16:06:10.727045
\.


--
-- TOC entry 3683 (class 0 OID 96268)
-- Dependencies: 217
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.members (id, member_code, name, vehicle_plate_number, email, phone_number, balance, active, registered_at, last_activity, updated_at) FROM stdin;
3	MBR003	Ahmad Wijaya	B9012GHI	ahmad.wijaya@gmail.com	081234567892	750000.00	t	2025-06-17 16:06:10.727045	\N	\N
4	MBR004	Dewi Lestari	B3456JKL	dewi.lestari@gmail.com	081234567893	300000.00	t	2025-06-17 16:06:10.727045	\N	\N
5	MBR005	Rudi Hermawan	B7890MNO	rudi.hermawan@gmail.com	081234567894	150000.00	t	2025-06-17 16:06:10.727045	\N	\N
1	MBR001	Budi Santoso	B1234ABC	budi.santoso@gmail.com	081234567890	489200.00	t	2025-06-17 16:06:10.727045	2025-06-14 14:00:00	\N
2	MBR002	Siti Rahayu	B5678DEF	siti.rahayu@gmail.com	081234567891	236500.00	t	2025-06-17 16:06:10.727045	2025-06-14 16:30:00	\N
\.


--
-- TOC entry 3685 (class 0 OID 96285)
-- Dependencies: 219
-- Data for Name: parking_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parking_tickets (id, plate_number, vehicle_type, check_in_time, check_out_time, check_in_photo_path, check_out_photo_path, check_in_gate, check_out_gate, check_in_operator, check_out_operator, member_id, member_name, parking_fee, status, created_at, updated_at) FROM stdin;
1	B1111AAA	CAR	2025-06-14 08:00:00	2025-06-14 10:30:00	\N	\N	Gate A	Gate B	Op. Andi	Op. Budi	\N	\N	9000.00	COMPLETED	2025-06-17 16:06:10.727045	\N
2	B2222BBB	MOTORCYCLE	2025-06-14 09:15:00	2025-06-14 11:45:00	\N	\N	Gate A	Gate A	Op. Andi	Op. Andi	\N	\N	9000.00	COMPLETED	2025-06-17 16:06:10.727045	\N
3	B1234ABC	CAR	2025-06-14 10:00:00	2025-06-14 14:00:00	\N	\N	Gate B	Gate B	Op. Budi	Op. Citra	1	Budi Santoso	10800.00	COMPLETED	2025-06-17 16:06:10.727045	\N
4	B3333CCC	CAR	2025-06-14 11:30:00	2025-06-14 15:00:00	\N	\N	Gate A	Gate A	Op. Citra	Op. Dedi	\N	\N	12000.00	COMPLETED	2025-06-17 16:06:10.727045	\N
5	B5678DEF	CAR	2025-06-14 12:00:00	2025-06-14 16:30:00	\N	\N	Gate B	Gate A	Op. Dedi	Op. Eka	2	Siti Rahayu	13500.00	COMPLETED	2025-06-17 16:06:10.727045	\N
6	B4444DDD	CAR	2025-06-15 07:30:00	\N	\N	\N	Gate A	\N	Op. Andi	\N	\N	\N	\N	ACTIVE	2025-06-17 16:06:10.727045	\N
7	B5555EEE	MOTORCYCLE	2025-06-15 08:45:00	\N	\N	\N	Gate B	\N	Op. Budi	\N	\N	\N	\N	ACTIVE	2025-06-17 16:06:10.727045	\N
8	B6666FFF	TRUCK	2025-06-15 09:00:00	\N	\N	\N	Gate A	\N	Op. Citra	\N	\N	\N	\N	ACTIVE	2025-06-17 16:06:10.727045	\N
\.


--
-- TOC entry 3689 (class 0 OID 96318)
-- Dependencies: 223
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, parking_ticket_id, amount, payment_method, payment_time, reference_number, status, created_at) FROM stdin;
1	1	9000.00	CASH	2025-06-14 10:30:00	CS-1718343000001	SUCCESS	2025-06-17 16:06:10.727045
2	2	9000.00	QRIS	2025-06-14 11:45:00	QR-1718347500001	SUCCESS	2025-06-17 16:06:10.727045
3	3	10800.00	MEMBER_BALANCE	2025-06-14 14:00:00	MB-1718355600001	SUCCESS	2025-06-17 16:06:10.727045
4	4	12000.00	FLAZZ	2025-06-14 15:00:00	FL-1718359200001	SUCCESS	2025-06-17 16:06:10.727045
5	5	13500.00	MEMBER_BALANCE	2025-06-14 16:30:00	MB-1718364600001	SUCCESS	2025-06-17 16:06:10.727045
\.


--
-- TOC entry 3687 (class 0 OID 96303)
-- Dependencies: 221
-- Data for Name: vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vouchers (id, code, description, discount_type, discount_value, minimum_amount, valid_from, valid_until, active, usage_limit, usage_count, created_at, terminated_at) FROM stdin;
1	NEWMEMBER	Diskon member baru 20%	PERCENTAGE	20.00	10000.00	2025-01-01 00:00:00	2025-12-31 00:00:00	t	\N	0	2025-06-17 16:06:10.727045	\N
2	WEEKEND50	Diskon weekend 50%	PERCENTAGE	50.00	20000.00	2025-01-01 00:00:00	2025-12-31 00:00:00	t	\N	0	2025-06-17 16:06:10.727045	\N
3	PARKEE10K	Potongan Rp 10.000	FIXED_AMOUNT	10000.00	15000.00	2025-01-01 00:00:00	2025-06-30 00:00:00	t	\N	0	2025-06-17 16:06:10.727045	\N
4	LEBARAN2025	Spesial Lebaran 30%	PERCENTAGE	30.00	0.00	2025-03-01 00:00:00	2025-04-30 00:00:00	t	\N	0	2025-06-17 16:06:10.727045	\N
5	FLAT5K	Potongan langsung Rp 5.000	FIXED_AMOUNT	5000.00	5000.00	2025-01-01 00:00:00	2025-12-31 00:00:00	t	\N	0	2025-06-17 16:06:10.727045	\N
\.


--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 224
-- Name: invoice_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_receipts_id_seq', 5, true);


--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 216
-- Name: members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.members_id_seq', 5, true);


--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 218
-- Name: parking_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parking_tickets_id_seq', 8, true);


--
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 222
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 5, true);


--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 220
-- Name: vouchers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vouchers_id_seq', 5, true);


--
-- TOC entry 3499 (class 2606 OID 96265)
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- TOC entry 3529 (class 2606 OID 96347)
-- Name: invoice_receipts invoice_receipts_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_receipts
    ADD CONSTRAINT invoice_receipts_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 3531 (class 2606 OID 96345)
-- Name: invoice_receipts invoice_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_receipts
    ADD CONSTRAINT invoice_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 3505 (class 2606 OID 96278)
-- Name: members members_member_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_member_code_key UNIQUE (member_code);


--
-- TOC entry 3507 (class 2606 OID 96276)
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- TOC entry 3509 (class 2606 OID 96280)
-- Name: members members_vehicle_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_vehicle_plate_number_key UNIQUE (vehicle_plate_number);


--
-- TOC entry 3514 (class 2606 OID 96293)
-- Name: parking_tickets parking_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 3525 (class 2606 OID 96325)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3518 (class 2606 OID 96314)
-- Name: vouchers vouchers_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key UNIQUE (code);


--
-- TOC entry 3520 (class 2606 OID 96312)
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- TOC entry 3500 (class 1259 OID 96266)
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- TOC entry 3510 (class 1259 OID 96300)
-- Name: idx_check_in_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_check_in_time ON public.parking_tickets USING btree (check_in_time);


--
-- TOC entry 3501 (class 1259 OID 96282)
-- Name: idx_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email ON public.members USING btree (email);


--
-- TOC entry 3526 (class 1259 OID 96354)
-- Name: idx_invoice_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_date ON public.invoice_receipts USING btree (invoice_date);


--
-- TOC entry 3527 (class 1259 OID 96353)
-- Name: idx_invoice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoice_number ON public.invoice_receipts USING btree (invoice_number);


--
-- TOC entry 3521 (class 1259 OID 96332)
-- Name: idx_payment_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_method ON public.payments USING btree (payment_method);


--
-- TOC entry 3522 (class 1259 OID 96331)
-- Name: idx_payment_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_time ON public.payments USING btree (payment_time);


--
-- TOC entry 3502 (class 1259 OID 96283)
-- Name: idx_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_phone ON public.members USING btree (phone_number);


--
-- TOC entry 3511 (class 1259 OID 96299)
-- Name: idx_plate_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plate_number ON public.parking_tickets USING btree (plate_number);


--
-- TOC entry 3523 (class 1259 OID 96333)
-- Name: idx_reference_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reference_number ON public.payments USING btree (reference_number);


--
-- TOC entry 3512 (class 1259 OID 96301)
-- Name: idx_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status ON public.parking_tickets USING btree (status);


--
-- TOC entry 3515 (class 1259 OID 96316)
-- Name: idx_valid_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_valid_dates ON public.vouchers USING btree (valid_from, valid_until);


--
-- TOC entry 3503 (class 1259 OID 96281)
-- Name: idx_vehicle_plate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_plate ON public.members USING btree (vehicle_plate_number);


--
-- TOC entry 3516 (class 1259 OID 96315)
-- Name: idx_voucher_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_voucher_code ON public.vouchers USING btree (code);


--
-- TOC entry 3680 (class 2618 OID 96367)
-- Name: active_members_statistics _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.active_members_statistics AS
 SELECT m.id,
    m.member_code,
    m.name,
    m.vehicle_plate_number,
    count(pt.id) AS total_parkings,
    sum(pt.parking_fee) AS total_spent,
    m.balance AS current_balance,
    m.last_activity
   FROM (public.members m
     LEFT JOIN public.parking_tickets pt ON ((m.id = pt.member_id)))
  WHERE (m.active = true)
  GROUP BY m.id
  ORDER BY (count(pt.id)) DESC;


--
-- TOC entry 3534 (class 2606 OID 96348)
-- Name: invoice_receipts invoice_receipts_parking_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_receipts
    ADD CONSTRAINT invoice_receipts_parking_ticket_id_fkey FOREIGN KEY (parking_ticket_id) REFERENCES public.parking_tickets(id);


--
-- TOC entry 3532 (class 2606 OID 96294)
-- Name: parking_tickets parking_tickets_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- TOC entry 3533 (class 2606 OID 96326)
-- Name: payments payments_parking_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_parking_ticket_id_fkey FOREIGN KEY (parking_ticket_id) REFERENCES public.parking_tickets(id);


-- Completed on 2025-06-17 16:08:21 WIB

--
-- PostgreSQL database dump complete
--

