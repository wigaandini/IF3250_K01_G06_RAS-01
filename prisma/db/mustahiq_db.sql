--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity_Log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Activity_Log" (
    id integer NOT NULL,
    user_id integer,
    action character varying(50),
    table_name character varying(50),
    record_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent character varying(255),
    "timestamp" timestamp with time zone
);


ALTER TABLE public."Activity_Log" OWNER TO postgres;

--
-- Name: COLUMN "Activity_Log".action; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Activity_Log".action IS 'create, update, delete, login, logout';


--
-- Name: COLUMN "Activity_Log".old_values; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Activity_Log".old_values IS 'JSON of previous values';


--
-- Name: COLUMN "Activity_Log".new_values; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Activity_Log".new_values IS 'JSON of new values';


--
-- Name: Activity_Log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Activity_Log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Activity_Log_id_seq" OWNER TO postgres;

--
-- Name: Activity_Log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Activity_Log_id_seq" OWNED BY public."Activity_Log".id;


--
-- Name: Amil; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Amil" (
    user_id integer NOT NULL,
    permissions jsonb
);


ALTER TABLE public."Amil" OWNER TO postgres;

--
-- Name: COLUMN "Amil".permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Amil".permissions IS 'JSON with specific amil permissions';


--
-- Name: Bantuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bantuan" (
    id integer NOT NULL,
    mustahiq_id integer,
    program_id integer,
    lokasi_id integer,
    tanggal date,
    jumlah integer,
    bukti_penyaluran character varying(255),
    catatan text,
    created_at timestamp with time zone,
    created_by integer,
    updated_at timestamp with time zone,
    status character varying(20)
);


ALTER TABLE public."Bantuan" OWNER TO postgres;

--
-- Name: COLUMN "Bantuan".bukti_penyaluran; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Bantuan".bukti_penyaluran IS 'Path to photo/document';


--
-- Name: COLUMN "Bantuan".status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Bantuan".status IS 'pending, delivered, cancelled';


--
-- Name: Bantuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Bantuan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bantuan_id_seq" OWNER TO postgres;

--
-- Name: Bantuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Bantuan_id_seq" OWNED BY public."Bantuan".id;


--
-- Name: Dashboard_Settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dashboard_Settings" (
    id integer NOT NULL,
    user_id integer,
    settings jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public."Dashboard_Settings" OWNER TO postgres;

--
-- Name: COLUMN "Dashboard_Settings".settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Dashboard_Settings".settings IS 'JSON of map and dashboard preferences';


--
-- Name: Dashboard_Settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Dashboard_Settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Dashboard_Settings_id_seq" OWNER TO postgres;

--
-- Name: Dashboard_Settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Dashboard_Settings_id_seq" OWNED BY public."Dashboard_Settings".id;


--
-- Name: Lokasi_Bantuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Lokasi_Bantuan" (
    id integer NOT NULL,
    nama_lokasi character varying(255),
    alamat text,
    tipe character varying(50),
    deskripsi text,
    "GPS_lat" double precision,
    "GPS_long" double precision,
    foto character varying(255),
    status character varying(20),
    created_at timestamp with time zone,
    created_by integer,
    updated_at timestamp with time zone
);


ALTER TABLE public."Lokasi_Bantuan" OWNER TO postgres;

--
-- Name: COLUMN "Lokasi_Bantuan".tipe; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Lokasi_Bantuan".tipe IS 'komunitas, bencana, individu';


--
-- Name: COLUMN "Lokasi_Bantuan".foto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Lokasi_Bantuan".foto IS 'Path to location photo';


--
-- Name: COLUMN "Lokasi_Bantuan".status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Lokasi_Bantuan".status IS 'active, inactive';


--
-- Name: Lokasi_Bantuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Lokasi_Bantuan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Lokasi_Bantuan_id_seq" OWNER TO postgres;

--
-- Name: Lokasi_Bantuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Lokasi_Bantuan_id_seq" OWNED BY public."Lokasi_Bantuan".id;


--
-- Name: Mustahiq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Mustahiq" (
    id integer NOT NULL,
    "NIK" character varying(20),
    nama character varying(255),
    alamat text,
    kecamatan character varying(100),
    kabupaten character varying(100),
    provinsi character varying(100),
    kode_pos character varying(10),
    no_telepon character varying(20),
    "GPS_lat" double precision,
    "GPS_long" double precision,
    foto character varying(255),
    status character varying(20),
    created_at timestamp with time zone,
    created_by integer,
    updated_at timestamp with time zone,
    updated_by integer
);


ALTER TABLE public."Mustahiq" OWNER TO postgres;

--
-- Name: COLUMN "Mustahiq".foto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Mustahiq".foto IS 'Path to stored photo';


--
-- Name: COLUMN "Mustahiq".status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Mustahiq".status IS 'active, inactive';


--
-- Name: Mustahiq_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Mustahiq_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Mustahiq_id_seq" OWNER TO postgres;

--
-- Name: Mustahiq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Mustahiq_id_seq" OWNED BY public."Mustahiq".id;


--
-- Name: Program_Bantuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Program_Bantuan" (
    id integer NOT NULL,
    nama_program character varying(255),
    deskripsi text,
    kriteria text,
    jumlah_bantuan integer,
    penyalur character varying(255),
    tanggal_mulai date,
    tanggal_selesai date,
    status character varying(20),
    created_at timestamp with time zone,
    created_by integer,
    updated_at timestamp with time zone
);


ALTER TABLE public."Program_Bantuan" OWNER TO postgres;

--
-- Name: COLUMN "Program_Bantuan".status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Program_Bantuan".status IS 'active, completed, cancelled';


--
-- Name: Program_Bantuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Program_Bantuan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Program_Bantuan_id_seq" OWNER TO postgres;

--
-- Name: Program_Bantuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Program_Bantuan_id_seq" OWNED BY public."Program_Bantuan".id;


--
-- Name: Relawan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Relawan" (
    user_id integer NOT NULL,
    permissions jsonb
);


ALTER TABLE public."Relawan" OWNER TO postgres;

--
-- Name: COLUMN "Relawan".permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Relawan".permissions IS 'JSON with specific relawan permissions';


--
-- Name: Riwayat_Bantuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Riwayat_Bantuan" (
    id integer NOT NULL,
    mustahiq_id integer,
    program_id integer,
    lokasi_id integer,
    tanggal date,
    jumlah integer,
    status character varying(20),
    created_at timestamp with time zone
);


ALTER TABLE public."Riwayat_Bantuan" OWNER TO postgres;

--
-- Name: Riwayat_Bantuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Riwayat_Bantuan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Riwayat_Bantuan_id_seq" OWNER TO postgres;

--
-- Name: Riwayat_Bantuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Riwayat_Bantuan_id_seq" OWNED BY public."Riwayat_Bantuan".id;


--
-- Name: Superadmin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Superadmin" (
    user_id integer NOT NULL,
    permissions jsonb
);


ALTER TABLE public."Superadmin" OWNER TO postgres;

--
-- Name: COLUMN "Superadmin".permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Superadmin".permissions IS 'JSON with specific superadmin permissions';


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    nama character varying(255),
    email character varying(255),
    password character varying(255),
    role character varying(50),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: COLUMN "User".email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."User".email IS 'Domain restricted to @rumahamal.org';


--
-- Name: COLUMN "User".password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."User".password IS 'Stored as hashed value';


--
-- Name: COLUMN "User".role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."User".role IS 'superadmin, amil, relawan';


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Activity_Log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Activity_Log" ALTER COLUMN id SET DEFAULT nextval('public."Activity_Log_id_seq"'::regclass);


--
-- Name: Bantuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bantuan" ALTER COLUMN id SET DEFAULT nextval('public."Bantuan_id_seq"'::regclass);


--
-- Name: Dashboard_Settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dashboard_Settings" ALTER COLUMN id SET DEFAULT nextval('public."Dashboard_Settings_id_seq"'::regclass);


--
-- Name: Lokasi_Bantuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lokasi_Bantuan" ALTER COLUMN id SET DEFAULT nextval('public."Lokasi_Bantuan_id_seq"'::regclass);


--
-- Name: Mustahiq id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mustahiq" ALTER COLUMN id SET DEFAULT nextval('public."Mustahiq_id_seq"'::regclass);


--
-- Name: Program_Bantuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Program_Bantuan" ALTER COLUMN id SET DEFAULT nextval('public."Program_Bantuan_id_seq"'::regclass);


--
-- Name: Riwayat_Bantuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Riwayat_Bantuan" ALTER COLUMN id SET DEFAULT nextval('public."Riwayat_Bantuan_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Activity_Log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Activity_Log" (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, "timestamp") FROM stdin;
\.


--
-- Data for Name: Amil; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Amil" (user_id, permissions) FROM stdin;
\.


--
-- Data for Name: Bantuan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bantuan" (id, mustahiq_id, program_id, lokasi_id, tanggal, jumlah, bukti_penyaluran, catatan, created_at, created_by, updated_at, status) FROM stdin;
\.


--
-- Data for Name: Dashboard_Settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dashboard_Settings" (id, user_id, settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Lokasi_Bantuan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lokasi_Bantuan" (id, nama_lokasi, alamat, tipe, deskripsi, "GPS_lat", "GPS_long", foto, status, created_at, created_by, updated_at) FROM stdin;
\.


--
-- Data for Name: Mustahiq; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Mustahiq" (id, "NIK", nama, alamat, kecamatan, kabupaten, provinsi, kode_pos, no_telepon, "GPS_lat", "GPS_long", foto, status, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1234567890123456	Budi Santoso	Jl. Merdeka No. 1	Ciputat	Tangerang Selatan	Banten	15411	081234567890	-6.2809	106.715	\N	active	\N	2	\N	\N
2	6543210987654321	Siti Aisyah	Jl. Kemerdekaan No. 10	Setiabudi	Jakarta Selatan	DKI Jakarta	12910	081298765432	-6.2088	106.8456	\N	inactive	\N	2	\N	\N
\.


--
-- Data for Name: Program_Bantuan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Program_Bantuan" (id, nama_program, deskripsi, kriteria, jumlah_bantuan, penyalur, tanggal_mulai, tanggal_selesai, status, created_at, created_by, updated_at) FROM stdin;
1	Bantuan Sembako	Bantuan untuk mustahiq dalam bentuk sembako.	Mustahiq yang terdaftar sebagai penerima	100	Amil Zakat	\N	\N	active	\N	1	\N
2	Santunan Anak Yatim	Santunan untuk anak yatim piatu.	Anak yatim piatu yang memenuhi kriteria	50	Amil Zakat	\N	\N	active	\N	1	\N
\.


--
-- Data for Name: Relawan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Relawan" (user_id, permissions) FROM stdin;
\.


--
-- Data for Name: Riwayat_Bantuan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Riwayat_Bantuan" (id, mustahiq_id, program_id, lokasi_id, tanggal, jumlah, status, created_at) FROM stdin;
\.


--
-- Data for Name: Superadmin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Superadmin" (user_id, permissions) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, nama, email, password, role, created_at, updated_at) FROM stdin;
1	Super Admin	admin@rumahamal.org	$2b$10$thopSYLNOyEeugwMcXA7juLy7PZwSOi1PG.8dyz1cvJlBOpcVzZrK	superadmin	\N	\N
2	Amil User	amil@rumahamal.org	$2b$10$E7ZBFTasgcZqbGbc7FON4OTHsmvsRLBcapRMIa8d3JQ28a18qoxz.	amil	\N	\N
3	Relawan User	relawan@rumahamal.org	$2b$10$Gm2z9xodAQkLXq3SmBo2/usWL8iyuA7qKc7/E906VSATfhjp2qvEG	relawan	\N	\N
\.


--
-- Name: Activity_Log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Activity_Log_id_seq"', 1, false);


--
-- Name: Bantuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Bantuan_id_seq"', 1, false);


--
-- Name: Dashboard_Settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Dashboard_Settings_id_seq"', 1, false);


--
-- Name: Lokasi_Bantuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Lokasi_Bantuan_id_seq"', 1, false);


--
-- Name: Mustahiq_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Mustahiq_id_seq"', 2, true);


--
-- Name: Program_Bantuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Program_Bantuan_id_seq"', 2, true);


--
-- Name: Riwayat_Bantuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Riwayat_Bantuan_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 7, true);


--
-- Name: Activity_Log Activity_Log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Activity_Log"
    ADD CONSTRAINT "Activity_Log_pkey" PRIMARY KEY (id);


--
-- Name: Amil Amil_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amil"
    ADD CONSTRAINT "Amil_pkey" PRIMARY KEY (user_id);


--
-- Name: Bantuan Bantuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bantuan"
    ADD CONSTRAINT "Bantuan_pkey" PRIMARY KEY (id);


--
-- Name: Dashboard_Settings Dashboard_Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dashboard_Settings"
    ADD CONSTRAINT "Dashboard_Settings_pkey" PRIMARY KEY (id);


--
-- Name: Lokasi_Bantuan Lokasi_Bantuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lokasi_Bantuan"
    ADD CONSTRAINT "Lokasi_Bantuan_pkey" PRIMARY KEY (id);


--
-- Name: Mustahiq Mustahiq_NIK_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mustahiq"
    ADD CONSTRAINT "Mustahiq_NIK_key" UNIQUE ("NIK");


--
-- Name: Mustahiq Mustahiq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mustahiq"
    ADD CONSTRAINT "Mustahiq_pkey" PRIMARY KEY (id);


--
-- Name: Program_Bantuan Program_Bantuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Program_Bantuan"
    ADD CONSTRAINT "Program_Bantuan_pkey" PRIMARY KEY (id);


--
-- Name: Relawan Relawan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relawan"
    ADD CONSTRAINT "Relawan_pkey" PRIMARY KEY (user_id);


--
-- Name: Riwayat_Bantuan Riwayat_Bantuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Riwayat_Bantuan"
    ADD CONSTRAINT "Riwayat_Bantuan_pkey" PRIMARY KEY (id);


--
-- Name: Superadmin Superadmin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Superadmin"
    ADD CONSTRAINT "Superadmin_pkey" PRIMARY KEY (user_id);


--
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Program_Bantuan unique_nama_program; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Program_Bantuan"
    ADD CONSTRAINT unique_nama_program UNIQUE (nama_program);


--
-- Name: Activity_Log_table_name_record_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Activity_Log_table_name_record_id_idx" ON public."Activity_Log" USING btree (table_name, record_id);


--
-- Name: Activity_Log_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Activity_Log_timestamp_idx" ON public."Activity_Log" USING btree ("timestamp");


--
-- Name: Activity_Log_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Activity_Log_user_id_idx" ON public."Activity_Log" USING btree (user_id);


--
-- Name: Bantuan_mustahiq_id_program_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Bantuan_mustahiq_id_program_id_idx" ON public."Bantuan" USING btree (mustahiq_id, program_id);


--
-- Name: Bantuan_tanggal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Bantuan_tanggal_idx" ON public."Bantuan" USING btree (tanggal);


--
-- Name: Dashboard_Settings_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Dashboard_Settings_user_id_idx" ON public."Dashboard_Settings" USING btree (user_id);


--
-- Name: Lokasi_Bantuan_tipe_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Lokasi_Bantuan_tipe_idx" ON public."Lokasi_Bantuan" USING btree (tipe);


--
-- Name: Mustahiq_NIK_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Mustahiq_NIK_idx" ON public."Mustahiq" USING btree ("NIK");


--
-- Name: Program_Bantuan_nama_program_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Program_Bantuan_nama_program_idx" ON public."Program_Bantuan" USING btree (nama_program);


--
-- Name: Riwayat_Bantuan_mustahiq_id_program_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Riwayat_Bantuan_mustahiq_id_program_id_idx" ON public."Riwayat_Bantuan" USING btree (mustahiq_id, program_id);


--
-- Name: Riwayat_Bantuan_tanggal_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Riwayat_Bantuan_tanggal_idx" ON public."Riwayat_Bantuan" USING btree (tanggal);


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: location_coords; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX location_coords ON public."Lokasi_Bantuan" USING btree ("GPS_lat", "GPS_long");


--
-- Name: mustahiq_coords; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mustahiq_coords ON public."Mustahiq" USING btree ("GPS_lat", "GPS_long");


--
-- Name: Activity_Log Activity_Log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Activity_Log"
    ADD CONSTRAINT "Activity_Log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id);


--
-- Name: Amil Amil_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amil"
    ADD CONSTRAINT "Amil_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id);


--
-- Name: Bantuan Bantuan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bantuan"
    ADD CONSTRAINT "Bantuan_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id);


--
-- Name: Bantuan Bantuan_lokasi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bantuan"
    ADD CONSTRAINT "Bantuan_lokasi_id_fkey" FOREIGN KEY (lokasi_id) REFERENCES public."Lokasi_Bantuan"(id);


--
-- Name: Bantuan Bantuan_mustahiq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bantuan"
    ADD CONSTRAINT "Bantuan_mustahiq_id_fkey" FOREIGN KEY (mustahiq_id) REFERENCES public."Mustahiq"(id);


--
-- Name: Bantuan Bantuan_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bantuan"
    ADD CONSTRAINT "Bantuan_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public."Program_Bantuan"(id);


--
-- Name: Dashboard_Settings Dashboard_Settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dashboard_Settings"
    ADD CONSTRAINT "Dashboard_Settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id);


--
-- Name: Lokasi_Bantuan Lokasi_Bantuan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lokasi_Bantuan"
    ADD CONSTRAINT "Lokasi_Bantuan_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id);


--
-- Name: Mustahiq Mustahiq_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mustahiq"
    ADD CONSTRAINT "Mustahiq_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id);


--
-- Name: Mustahiq Mustahiq_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mustahiq"
    ADD CONSTRAINT "Mustahiq_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public."User"(id);


--
-- Name: Program_Bantuan Program_Bantuan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Program_Bantuan"
    ADD CONSTRAINT "Program_Bantuan_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id);


--
-- Name: Relawan Relawan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relawan"
    ADD CONSTRAINT "Relawan_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id);


--
-- Name: Riwayat_Bantuan Riwayat_Bantuan_lokasi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Riwayat_Bantuan"
    ADD CONSTRAINT "Riwayat_Bantuan_lokasi_id_fkey" FOREIGN KEY (lokasi_id) REFERENCES public."Lokasi_Bantuan"(id);


--
-- Name: Riwayat_Bantuan Riwayat_Bantuan_mustahiq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Riwayat_Bantuan"
    ADD CONSTRAINT "Riwayat_Bantuan_mustahiq_id_fkey" FOREIGN KEY (mustahiq_id) REFERENCES public."Mustahiq"(id);


--
-- Name: Riwayat_Bantuan Riwayat_Bantuan_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Riwayat_Bantuan"
    ADD CONSTRAINT "Riwayat_Bantuan_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public."Program_Bantuan"(id);


--
-- Name: Superadmin Superadmin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Superadmin"
    ADD CONSTRAINT "Superadmin_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id);


--
-- PostgreSQL database dump complete
--

