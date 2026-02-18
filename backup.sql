--
-- PostgreSQL database dump
--

\restrict Jvm3ZFgsl9IbmrdFwzyhXzJq8TdhgGTXJVa6B07chf1JvRDG8DvSU0m8IBnsXzS

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_messages (
    id integer NOT NULL,
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_messages OWNER TO postgres;

--
-- Name: admin_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_messages_id_seq OWNER TO postgres;

--
-- Name: admin_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_messages_id_seq OWNED BY public.admin_messages.id;


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    type text NOT NULL,
    user_id text NOT NULL,
    user_email text,
    user_nickname text,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title text NOT NULL,
    content text,
    image_url text,
    link_url text,
    type text DEFAULT 'banner'::text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    title text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    discount_type text DEFAULT 'percent'::text NOT NULL,
    discount_value integer DEFAULT 0 NOT NULL,
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    place_id integer,
    is_welcome_coupon boolean DEFAULT false,
    service_description text
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coupons_id_seq OWNER TO postgres;

--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: customer_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_chat_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    sender_id text NOT NULL,
    sender_role text DEFAULT 'customer'::text NOT NULL,
    sender_name text DEFAULT '방문자'::text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customer_chat_messages OWNER TO postgres;

--
-- Name: customer_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_chat_messages_id_seq OWNER TO postgres;

--
-- Name: customer_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_chat_messages_id_seq OWNED BY public.customer_chat_messages.id;


--
-- Name: customer_chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_chat_rooms (
    id integer NOT NULL,
    visitor_id text NOT NULL,
    visitor_name text DEFAULT '방문자'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    last_message text,
    last_message_at timestamp without time zone,
    unread_by_admin integer DEFAULT 0,
    unread_by_visitor integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customer_chat_rooms OWNER TO postgres;

--
-- Name: customer_chat_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_chat_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_chat_rooms_id_seq OWNER TO postgres;

--
-- Name: customer_chat_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_chat_rooms_id_seq OWNED BY public.customer_chat_rooms.id;


--
-- Name: eco_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eco_profiles (
    id integer NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.eco_profiles OWNER TO postgres;

--
-- Name: eco_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eco_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eco_profiles_id_seq OWNER TO postgres;

--
-- Name: eco_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eco_profiles_id_seq OWNED BY public.eco_profiles.id;


--
-- Name: expense_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_groups (
    id integer NOT NULL,
    name text NOT NULL,
    participants jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_id text NOT NULL,
    budget integer DEFAULT 0
);


ALTER TABLE public.expense_groups OWNER TO postgres;

--
-- Name: expense_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_groups_id_seq OWNER TO postgres;

--
-- Name: expense_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_groups_id_seq OWNED BY public.expense_groups.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    group_id integer NOT NULL,
    description text DEFAULT ''::text,
    amount integer DEFAULT 0 NOT NULL,
    category text DEFAULT 'other'::text,
    paid_by text DEFAULT ''::text,
    split_among jsonb DEFAULT '[]'::jsonb,
    date text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    memo text DEFAULT ''::text
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: instagram_synced_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instagram_synced_posts (
    id integer NOT NULL,
    instagram_id text NOT NULL,
    post_id integer NOT NULL,
    synced_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.instagram_synced_posts OWNER TO postgres;

--
-- Name: instagram_synced_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.instagram_synced_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instagram_synced_posts_id_seq OWNER TO postgres;

--
-- Name: instagram_synced_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.instagram_synced_posts_id_seq OWNED BY public.instagram_synced_posts.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: place_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.place_categories (
    id text NOT NULL,
    label_ko text NOT NULL,
    label_en text NOT NULL,
    label_zh text,
    label_vi text,
    label_ru text,
    label_ja text,
    color text DEFAULT '#64748b'::text,
    gradient text DEFAULT 'from-gray-600 to-gray-700'::text,
    icon text DEFAULT 'MapPin'::text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_adult_only boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.place_categories OWNER TO postgres;

--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id integer NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'attraction'::text NOT NULL,
    description text,
    main_image text,
    images jsonb DEFAULT '[]'::jsonb,
    latitude text,
    longitude text,
    address text,
    phone text,
    website text,
    opening_hours text,
    price_range text,
    tags jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_partner boolean DEFAULT false,
    discount_text text,
    menu_images jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.places_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.places_id_seq OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    author_id text NOT NULL,
    author_name text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_hidden boolean DEFAULT false,
    view_count integer DEFAULT 0
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.push_subscriptions OWNER TO postgres;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO postgres;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: quote_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text,
    image_url text DEFAULT ''::text,
    price_per_unit integer DEFAULT 0 NOT NULL,
    unit_label text DEFAULT '인'::text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    images text[] DEFAULT '{}'::text[],
    options text DEFAULT '[]'::text
);


ALTER TABLE public.quote_categories OWNER TO postgres;

--
-- Name: quote_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quote_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quote_categories_id_seq OWNER TO postgres;

--
-- Name: quote_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quote_categories_id_seq OWNED BY public.quote_categories.id;


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id integer NOT NULL,
    customer_name text NOT NULL,
    total_price integer NOT NULL,
    breakdown jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_id text,
    deposit_paid boolean DEFAULT false,
    check_in_date text,
    check_out_date text,
    memo text DEFAULT ''::text,
    deposit_amount integer DEFAULT 0,
    memo_images jsonb DEFAULT '[]'::jsonb,
    eco_picks jsonb DEFAULT '{}'::jsonb,
    assigned_by text,
    user_memo text DEFAULT ''::text
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotes_id_seq OWNER TO postgres;

--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- Name: saved_travel_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_travel_plans (
    id integer NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    purpose text NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    plan_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saved_travel_plans OWNER TO postgres;

--
-- Name: saved_travel_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_travel_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_travel_plans_id_seq OWNER TO postgres;

--
-- Name: saved_travel_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_travel_plans_id_seq OWNED BY public.saved_travel_plans.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: shop_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_products (
    id integer NOT NULL,
    name text NOT NULL,
    brand text DEFAULT ''::text,
    price integer DEFAULT 0 NOT NULL,
    quantity text DEFAULT ''::text,
    description text DEFAULT ''::text,
    image text DEFAULT ''::text,
    images text[] DEFAULT '{}'::text[],
    benefits text[] DEFAULT '{}'::text[],
    ingredients text DEFAULT ''::text,
    usage text DEFAULT ''::text,
    caution text DEFAULT ''::text,
    gradient text DEFAULT 'from-primary to-purple-600'::text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shop_products OWNER TO postgres;

--
-- Name: shop_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shop_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_products_id_seq OWNER TO postgres;

--
-- Name: shop_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shop_products_id_seq OWNED BY public.shop_products.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_settings_id_seq OWNER TO postgres;

--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: user_coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_coupons (
    id integer NOT NULL,
    user_id text NOT NULL,
    coupon_id integer NOT NULL,
    is_used boolean DEFAULT false,
    used_at timestamp without time zone,
    issued_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_coupons OWNER TO postgres;

--
-- Name: user_coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_coupons_id_seq OWNER TO postgres;

--
-- Name: user_coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_coupons_id_seq OWNED BY public.user_coupons.id;


--
-- Name: user_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_locations (
    id integer NOT NULL,
    nickname text NOT NULL,
    latitude text NOT NULL,
    longitude text NOT NULL,
    place_name text,
    place_category text,
    message text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_locations OWNER TO postgres;

--
-- Name: user_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_locations_id_seq OWNER TO postgres;

--
-- Name: user_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_locations_id_seq OWNED BY public.user_locations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    gender character varying,
    nickname character varying,
    birth_date character varying,
    password character varying,
    login_method character varying,
    email_verified boolean DEFAULT false,
    email_verification_token character varying,
    email_verification_expires timestamp without time zone,
    welcome_coupon_issued boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    can_view_nightlife18 boolean DEFAULT false,
    can_view_eco boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: villas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.villas (
    id integer NOT NULL,
    name text NOT NULL,
    main_image text,
    images jsonb DEFAULT '[]'::jsonb,
    weekday_price integer DEFAULT 350 NOT NULL,
    friday_price integer DEFAULT 380 NOT NULL,
    weekend_price integer DEFAULT 500 NOT NULL,
    latitude text,
    longitude text,
    address text,
    notes text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    holiday_price integer DEFAULT 550 NOT NULL,
    map_url text,
    max_guests integer DEFAULT 10,
    bedrooms integer DEFAULT 3,
    amenities jsonb DEFAULT '[]'::jsonb,
    is_best boolean DEFAULT false
);


ALTER TABLE public.villas OWNER TO postgres;

--
-- Name: villas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.villas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.villas_id_seq OWNER TO postgres;

--
-- Name: villas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.villas_id_seq OWNED BY public.villas.id;


--
-- Name: visitor_count; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visitor_count (
    id integer NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    last_reset_date text,
    total_count integer DEFAULT 15000 NOT NULL,
    real_count integer DEFAULT 0 NOT NULL,
    real_total_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.visitor_count OWNER TO postgres;

--
-- Name: visitor_count_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visitor_count_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visitor_count_id_seq OWNER TO postgres;

--
-- Name: visitor_count_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visitor_count_id_seq OWNED BY public.visitor_count.id;


--
-- Name: admin_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_messages ALTER COLUMN id SET DEFAULT nextval('public.admin_messages_id_seq'::regclass);


--
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: customer_chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.customer_chat_messages_id_seq'::regclass);


--
-- Name: customer_chat_rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_chat_rooms ALTER COLUMN id SET DEFAULT nextval('public.customer_chat_rooms_id_seq'::regclass);


--
-- Name: eco_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eco_profiles ALTER COLUMN id SET DEFAULT nextval('public.eco_profiles_id_seq'::regclass);


--
-- Name: expense_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_groups ALTER COLUMN id SET DEFAULT nextval('public.expense_groups_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: instagram_synced_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instagram_synced_posts ALTER COLUMN id SET DEFAULT nextval('public.instagram_synced_posts_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: quote_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_categories ALTER COLUMN id SET DEFAULT nextval('public.quote_categories_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- Name: saved_travel_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_travel_plans ALTER COLUMN id SET DEFAULT nextval('public.saved_travel_plans_id_seq'::regclass);


--
-- Name: shop_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_products ALTER COLUMN id SET DEFAULT nextval('public.shop_products_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: user_coupons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coupons ALTER COLUMN id SET DEFAULT nextval('public.user_coupons_id_seq'::regclass);


--
-- Name: user_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations ALTER COLUMN id SET DEFAULT nextval('public.user_locations_id_seq'::regclass);


--
-- Name: villas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.villas ALTER COLUMN id SET DEFAULT nextval('public.villas_id_seq'::regclass);


--
-- Name: visitor_count id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitor_count ALTER COLUMN id SET DEFAULT nextval('public.visitor_count_id_seq'::regclass);


--
-- Data for Name: admin_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_messages (id, sender_id, receiver_id, title, content, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_notifications (id, type, user_id, user_email, user_nickname, message, is_read, created_at) FROM stdin;
1	login	admin_vungtausaver	vungtausaver@admin.local	vungtausaver	로그인: vungtausaver (이메일)	t	2026-02-05 07:09:02.99312
2	login	admin_vungtausaver	vungtausaver@admin.local	vungtausaver	로그인: vungtausaver (이메일)	t	2026-02-05 08:30:52.073859
3	login	admin_vungtausaver	vungtausaver@admin.local	vungtausaver	로그인: vungtausaver (이메일)	f	2026-02-15 02:24:10.764125
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, image_url, link_url, type, is_active, sort_order, start_date, end_date, created_at, updated_at) FROM stdin;
3	ㅅㅁㅊㅁㅅㅁ				notice	t	0	\N	\N	2026-02-03 10:13:11.771353	2026-02-03 10:26:31.198
2	ýosbso				popup	t	1	\N	\N	2026-02-03 10:12:42.312687	2026-02-03 10:26:31.205
1	oabsksbs	kwbs			banner	t	2	\N	\N	2026-02-03 10:12:21.632652	2026-02-03 10:26:31.209
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, post_id, author_name, content, created_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, title, created_at) FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (id, name, description, discount_type, discount_value, valid_from, valid_until, is_active, created_at, place_id, is_welcome_coupon, service_description) FROM stdin;
1	방믄 10	ㅁㄴ	percent	10	\N	2026-02-28 00:00:00	t	2026-02-03 10:38:27.21451	47	f	\N
2	테스트 쿠폰 할인	테스트용 쿠폰입니다	percent	20	2026-02-04 00:00:00	2026-12-31 00:00:00	t	2026-02-04 14:25:04.108032	47	f	\N
\.


--
-- Data for Name: customer_chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_chat_messages (id, room_id, sender_id, sender_role, sender_name, message, created_at) FROM stdin;
1	6	test-rest-123	customer	테스트	REST API 테스트 메시지	2026-02-08 18:52:52.882936
2	7	visitor_705kn2ccav3mle3pqro	customer	방문자	안녕하세요 테스트입니다	2026-02-08 18:53:50.012009
3	7	visitor_705kn2ccav3mle3pqro	customer	방문자	두번째 메시지	2026-02-08 18:54:08.974494
4	8	api-test-unique-abc	customer	API테스트	API로 보낸 메시지	2026-02-08 18:55:35.45032
5	3	admin_vungtausaver	admin	관리자	ㅇㅇㅇ	2026-02-08 19:04:32.443445
\.


--
-- Data for Name: customer_chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_chat_rooms (id, visitor_id, visitor_name, status, last_message, last_message_at, unread_by_admin, unread_by_visitor, created_at) FROM stdin;
1	visitor_jypfyiwz7xhmle3cy9e	방문자	open	\N	\N	0	0	2026-02-08 18:43:35.652714
2	test-api-visitor-123	API 테스트 방문자	open	\N	\N	0	0	2026-02-08 18:44:46.536754
4	visitor_5v229dfaj8wmle3hf08	방문자	open	\N	\N	0	0	2026-02-08 18:47:05.222283
5	api-test-visitor-999	API테스트	open	\N	\N	0	0	2026-02-08 18:48:10.368082
6	test-rest-123	테스트	open	REST API 테스트 메시지	2026-02-08 18:52:52.887	1	0	2026-02-08 18:52:48.80692
7	visitor_705kn2ccav3mle3pqro	방문자	open	두번째 메시지	2026-02-08 18:54:09.009	2	0	2026-02-08 18:53:28.47051
8	api-test-unique-abc	API테스트	open	API로 보낸 메시지	2026-02-08 18:55:35.453	1	0	2026-02-08 18:55:27.148213
3	admin_vungtausaver	vungtausaver	open	ㅇㅇㅇ	2026-02-08 19:04:32.451	0	1	2026-02-08 18:45:40.981158
9	chattest-user-7788	Chat	open	\N	\N	0	0	2026-02-08 19:04:47.584513
\.


--
-- Data for Name: eco_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eco_profiles (id, name, image_url, is_active, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: expense_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_groups (id, name, participants, created_at, user_id, budget) FROM stdin;
3	Test Trip qGki	["Alice", "Bob", "Charlie"]	2026-01-15 18:05:44.669466	test-user-4srzJn	0
11	붕따우 3일 카지노 & 엔터테인먼트 특화 여행	["vungtausaver"]	2026-02-08 19:37:18.789071	admin_vungtausaver	450
12	붕따우 카지노 & 엔터테인먼트 3일	["vungtausaver"]	2026-02-08 19:41:07.234974	admin_vungtausaver	12367500
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, group_id, description, amount, category, paid_by, split_among, date, created_at, memo) FROM stdin;
7	11	붕따우 해산물 시장 (Day 1)	20	other	vungtausaver	["vungtausaver"]	2026-02-24	2026-02-08 19:37:19.007612	신선한 해산물을 직접 골라 즉석에서 조리해 먹을 수 있습니다.
8	11	임페리얼 seaside 클럽 (Day 1)	100	activity	vungtausaver	["vungtausaver"]	2026-02-24	2026-02-08 19:37:19.307689	첫 방문 시 20불 바우처 지급, 여권 필수 (21세 이상)
9	11	U.S Bar Club (Day 1)	20	food	vungtausaver	["vungtausaver"]	2026-02-24	2026-02-08 19:37:19.526908	다양한 칵테일과 편안한 분위기
10	11	붕따우 거대 예수상 (Day 2)	2	activity	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:19.821763	811개 계단을 올라 붕따우 전경 감상
11	11	붕따우 등대 (Day 2)	2	activity	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:20.044872	프랑스 식민지 시대 건축물, 아름다운 항구 조망
12	11	Old Man Cali - Hủ tiểu Mực (Day 2)	8	other	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:20.345998	추천 맛집, 해산물 쌀국수
13	11	Coffee Suối Bên Biển (Day 2)	4	food	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:20.638518	바다 전망이 좋은 분위기 있는 카페
14	11	Re.en 마사지 (Day 2)	15	activity	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:20.942579	피로를 풀어주는 60분 마사지
15	11	이안 돌판 삼겹살 (Day 2)	25	other	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:21.258773	도깨비 협력식당, 예약 시 10% 할인
16	11	Monaco casino (Day 2)	150	activity	vungtausaver	["vungtausaver"]	2026-02-25	2026-02-08 19:37:21.475632	외국인 전용 (21세 이상, 여권 필수)
17	11	꼬바붕따우 1호점 (Day 3)	10	other	vungtausaver	["vungtausaver"]	2026-02-26	2026-02-08 19:37:21.688438	현지인들이 즐겨 찾는 반콧과 반쎄오 맛집
18	12	해산물 고급 식당 (Day 1) - $15	382500	food	vungtausaver	["vungtausaver"]	2026-02-11	2026-02-08 19:41:07.469071	신선한 해산물 요리
19	12	Mi Amor Beach (Day 1) - $4	102000	food	vungtausaver	["vungtausaver"]	2026-02-11	2026-02-08 19:41:07.663422	바다를 바라보며 휴식
20	12	이안 돌판 삼겹살 (Day 1) - $20	510000	other	vungtausaver	["vungtausaver"]	2026-02-11	2026-02-08 19:41:07.952789	도깨비 협력식당, 예약 시 10% 할인
21	12	임페리얼 seaside 클럽 (Day 1) - $100	2550000	activity	vungtausaver	["vungtausaver"]	2026-02-11	2026-02-08 19:41:08.259462	외국인 전용 (여권 필수, 21세 이상)
22	12	붕따우 거대 예수상 (Day 2) - $2	51000	activity	vungtausaver	["vungtausaver"]	2026-02-12	2026-02-08 19:41:08.562436	811개 계단, 붕따우 시내와 바다 조망
23	12	화이트 펠리스(띠우 별장) (Day 2) - $3	76500	activity	vungtausaver	["vungtausaver"]	2026-02-12	2026-02-08 19:41:08.778091	프랑스 식민지 시대 건축물
24	12	분짜 하노이 (Day 2) - $7	178500	other	vungtausaver	["vungtausaver"]	2026-02-12	2026-02-08 19:41:09.073659	하노이 스타일의 맛있는 분짜
25	12	Re.en 마사지 (Day 2) - $15	382500	activity	vungtausaver	["vungtausaver"]	2026-02-12	2026-02-08 19:41:09.386751	도깨비 협력업체
26	12	해산물 야시장 로컬식당 (Day 2) - $18	459000	other	vungtausaver	["vungtausaver"]	2026-02-12	2026-02-08 19:41:09.585383	활기찬 야시장 분위기에서 신선한 해산물 즐기기
27	12	Monaco casino (Day 2) - $150	3825000	activity	vungtausaver	["vungtausaver"]	2026-02-12	2026-02-08 19:41:09.782782	외국인 전용 (여권 필수, 21세 이상)
28	12	붕따우 등대 (Day 3) - $2	51000	activity	vungtausaver	["vungtausaver"]	2026-02-13	2026-02-08 19:41:10.00005	프랑스 식민지 시대 건축물, 붕따우 전경 조망
29	12	로컬 식당 (껌땀) (Day 3) - $5	127500	other	vungtausaver	["vungtausaver"]	2026-02-13	2026-02-08 19:41:10.309926	베트남 대표 밥 요리
\.


--
-- Data for Name: instagram_synced_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instagram_synced_posts (id, instagram_id, post_id, synced_at) FROM stdin;
1	18106864810469895	9	2026-01-16 18:50:18.06844
2	18142570465365667	10	2026-01-16 18:50:18.075599
3	18289895686153565	11	2026-01-16 18:50:18.082202
4	18412129417042676	12	2026-01-16 18:50:18.088228
5	17920512095838648	13	2026-01-16 18:50:18.09508
6	17904542816834616	14	2026-01-16 18:50:18.10333
7	17993877281290380	15	2026-01-16 18:50:18.111081
8	18011785012977455	16	2026-01-16 18:50:18.117097
9	17964801251679911	17	2026-01-16 18:50:18.125251
10	18078691237430298	18	2026-01-16 18:50:18.132324
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: place_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.place_categories (id, label_ko, label_en, label_zh, label_vi, label_ru, label_ja, color, gradient, icon, sort_order, is_active, is_adult_only, created_at, updated_at) FROM stdin;
korean_food	한식	Korean Food	韩国料理	Món Hàn Quốc	Корейская еда	韓国料理	#f97316	from-orange-500 to-orange-700	Utensils	3	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.355
buffet	뷔페	Buffet	自助餐	Buffet	Буфет	ビュッフェ	#eab308	from-yellow-500 to-yellow-700	Utensils	4	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.358
chinese_food	중식	Chinese Food	中餐	Món Trung Quốc	Китайская еда	中華料理	#22c55e	from-green-500 to-green-700	Utensils	5	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.361
cafe	커피숍	Coffee Shops	咖啡店	Quán cà phê	Кофейни	カフェ	#6366f1	from-indigo-500 to-indigo-700	Coffee	6	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.363
exchange	환전소	Currency Exchange	货币兑换	Đổi tiền	Обмен валюты	両替所	#64748b	from-gray-500 to-gray-700	DollarSign	7	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.375
nightlife	밤문화	Nightlife	夜生活	Cuộc sống về đêm	Ночная жизнь	ナイトライフ	#ec4899	from-pink-600 to-purple-700	Music	9	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.383
nightlife18	밤문화 18+	Nightlife 18+	夜生活 18+	Cuộc sống về đêm 18+	Ночная жизнь 18+	ナイトライフ 18+	#dc2626	from-red-600 to-pink-700	Music	10	t	t	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.385
golfjang	골프장	Golf Club	高尔夫俱乐部	Câu lạc bộ golf	Гольф-клуб	ゴルフクラブ	#64748b	from-gray-600 to-gray-700	MapPin	11	t	f	2026-02-05 10:35:23.842555	2026-02-05 10:35:23.842555
services	마사지/이발소	Massage & Barber	按摩/理发	Massage/Cắt tóc	Массаж/Парикмахерская	マッサージ/理髪店	#0ea5e9	from-cyan-500 to-cyan-700	Scissors	0	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.29
attraction	관광명소	Attractions	景点	Địa điểm du lịch	Достопримечательности	観光スポット	#3b82f6	from-blue-500 to-blue-700	Camera	1	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.348
local_food	현지 음식점	Local Restaurants	当地餐厅	Nhà hàng địa phương	Местные рестораны	ローカルレストラン	#ef4444	from-red-500 to-red-700	Utensils	2	t	f	2026-02-05 03:15:45.065646	2026-02-05 10:06:37.352
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (id, name, category, description, main_image, images, latitude, longitude, address, phone, website, opening_hours, price_range, tags, is_active, sort_order, created_at, updated_at, is_partner, discount_text, menu_images) FROM stdin;
43	붕따우 등대	attraction	1910년 프랑스 식민지 시대에 건설된 역사적인 등대. 도시와 바다의 파노라마 전망을 제공합니다.	/@fs/home/runner/workspace/attached_assets/736414b25966415e9006dd674ec2aecf_1768452191679.jpeg	["/@fs/home/runner/workspace/attached_assets/736414b25966415e9006dd674ec2aecf_1768452191679.jpeg"]					https://maps.app.goo.gl/HMJbSLCR3bzZxsxy8			[]	t	10	2026-02-02 11:08:51.118096	2026-02-02 11:26:45.047	f	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
42	화이트 펠리스(띠우 별장)	attraction	1898년 프랑스 총독의 여름 별장으로 지어진 아름다운 백색 궁전. 열대 정원과 바다 전망이 인상적입니다.		[]	10.343158	107.088027			https://maps.app.goo.gl/LDkeQHy1Watfec51A			[]	t	30	2026-02-02 09:40:38.176842	2026-02-02 11:26:45.068	f	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
35	가보정	korean_food			[]	\N	\N	B12-1/10 Khu Trung Tâm Chí Linh, Phường Nguyễn An Ninh		https://maps.app.goo.gl/Mr1MXkLFMA5xfBjB6	\N	\N	[]	t	1	2026-02-01 06:20:01.682187	2026-02-01 06:20:01.682187	f	\N	[]
44	붕따우 거대 예수상	attraction	높이 32m의 거대한 예수상. 붕따우의 대표적인 랜드마크로 811개의 계단을 올라가면 아름다운 해안 전경을 감상할 수 있습니다.	/@fs/home/runner/workspace/attached_assets/Screenshot_20260115_113154_Gallery_1768451530261.jpg	["/@fs/home/runner/workspace/attached_assets/Screenshot_20260115_113154_Gallery_1768451530261.jpg"]					https://maps.app.goo.gl/CgLqYEKGLxodn27B8			[]	t	40	2026-02-02 11:08:58.352587	2026-02-02 11:26:45.072	f	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
37	Re.en 마사지	services		/@fs/home/runner/workspace/attached_assets/Screenshot_20260115_210912_Maps_1768486311161.jpg	[]	\N	\N			https://maps.app.goo.gl/zGjF1ZoN5TJY5jdu8	\N	\N	[]	t	2	2026-02-02 06:33:53.405536	2026-02-02 06:33:53.405536	f	\N	[]
36	Bi Roen 현지 고급 이발소	services		/api/public-images/place_1770015321887_bul0al.jpg	["/api/public-images/place_1770015321887_bul0al.jpg", "/api/public-images/place_1770015324146_f72c55.jpg"]	10.350189	107.091199	518 Thống Nhất Mới, Phường 8, Vũng Tàu		https://maps.app.goo.gl/yCMh6jYoLXLq8fgn7			[]	t	1	2026-02-02 06:33:48.135805	2026-02-02 08:20:35.801	t	붕따우 도깨비 카톡으로 예약 시 5% 할인	["/api/public-images/place_1770019322984_zm3fta.jpg", "/api/public-images/place_1770019358605_trkogl.jpg"]
38	Tiệm Vàng Kim Hiền - Thông Phương	exchange	\N	\N	[]	10.3495	107.0845	63 Lý Thường Kiệt, Phường 1, Vũng Tàu, Bà Rịa - Vũng Tàu	\N	\N	\N	\N	[]	t	1	2026-02-02 08:52:56.687662	2026-02-02 08:52:56.687662	f	\N	[]
39	오리국수 (오후 3시반 오픈)	local_food	오리고기 국수와 완탕 전문점. 오후 3시 30분부터 영업하며 현지인들에게 인기가 많습니다.	/@fs/home/runner/workspace/attached_assets/Screenshot_20260122_001013_Maps_1769015581823.jpg	[]	\N	\N			https://maps.app.goo.gl/HrorS5czrq91WqPUA	\N	\N	[]	t	1	2026-02-02 09:12:59.920017	2026-02-02 09:12:59.920017	f	\N	[]
41	전쟁기념관	attraction	베트남 전쟁과 지역 역사를 보여주는 박물관. 전쟁 유물과 역사적 사진들이 전시되어 있습니다.	/@fs/home/runner/workspace/attached_assets/20230318%EF%BC%BF130556_1768452191689.jpg	[]	\N	\N		0254 3852 421	https://maps.app.goo.gl/YiF3HpgZvXtKTfMCA	\N	\N	[]	t	20	2026-02-02 09:22:16.111859	2026-02-02 11:26:45.064	f	\N	[]
45	세계무기박물관	attraction	전 세계의 다양한 무기와 갑옷을 전시하는 독특한 박물관. 역사적인 무기 컬렉션을 감상할 수 있습니다.	/@fs/home/runner/workspace/attached_assets/Screenshot_20260123_141912_Maps_1769152870673.jpg	["/@fs/home/runner/workspace/attached_assets/Screenshot_20260123_141912_Maps_1769152870673.jpg"]					https://maps.app.goo.gl/P6G63jRcSRcpwKcP6			[]	t	50	2026-02-02 11:09:16.700792	2026-02-02 11:26:45.075	f	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
46	꼬바붕따우 3호점 (반콧,반쎄오)	local_food	꼬바 2호점은 더 넓고 쾌적한 공간에서 동일한 맛을 즐길 수 있습니다. 단체 손님에게 추천.	/@fs/home/runner/workspace/attached_assets/Screenshot_20260122_000613_Maps_1769015581776.jpg	["/@fs/home/runner/workspace/attached_assets/Screenshot_20260122_000613_Maps_1769015581776.jpg"]					https://maps.app.goo.gl/ftQz4Z437ZJZn5g68			[]	t	1010	2026-02-02 12:14:35.351252	2026-02-02 12:14:53.29	f	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
47	이안 돌판 삼겹살	korean_food	\N	\N	[]	10.329528	107.086860	300A Phan Chu Trinh, Phường 2, Vũng Tàu	\N	\N	\N	\N	[]	t	1	2026-02-04 05:29:07.411871	2026-02-04 05:29:07.411871	f	\N	[]
48	붕따우 한국 가라오케 럭셔리	nightlife18	한국식 럭셔리 가라오케	\N	[]	10.349	107.075	\N	\N	\N	\N	\N	[]	t	0	2026-02-09 07:05:35.11514	2026-02-09 07:05:35.11514	t	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
49	붕따우 가라오케 세븐	nightlife18	인기 가라오케	\N	[]	10.350	107.076	\N	\N	\N	\N	\N	[]	t	0	2026-02-09 07:05:35.11514	2026-02-09 07:05:35.11514	f	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
50	도쿄마사지	nightlife18	성인 마사지	\N	[]	10.348	107.074	\N	\N	\N	\N	\N	[]	t	0	2026-02-09 07:05:35.11514	2026-02-09 07:05:35.11514	t	붕따우 도깨비 카톡으로 예약 시 100,000동 할인	[]
51	로컬가라오케	nightlife18	현지 가라오케	\N	[]	10.347	107.073	\N	\N	\N	\N	\N	[]	t	0	2026-02-09 07:05:35.11514	2026-02-09 07:05:35.11514	t	붕따우 도깨비 카톡으로 예약 시 5% 할인	[]
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, title, content, image_url, author_id, author_name, created_at, updated_at, is_hidden, view_count) FROM stdin;
21	붕따우 E timber 커피숍	https://m.blog.naver.com/vungtausaver/224055379449	\N	42663365	붕따우도깨비	2026-01-16 19:40:29.727813	2026-01-16 19:40:29.727813	f	3
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) FROM stdin;
\.


--
-- Data for Name: quote_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quote_categories (id, name, description, image_url, price_per_unit, unit_label, is_active, sort_order, created_at, updated_at, images, options) FROM stdin;
7	낚시		/api/public-images/place_1770528627465_dgkee5.jpg	220	인	t	0	2026-02-08 05:30:49.913259	2026-02-08 05:30:49.913259	{/api/public-images/place_1770528627465_dgkee5.jpg,/api/public-images/place_1770528636759_huyble.jpg}	[{"name":"낚시 통통배","price":220},{"name":"모터보트 관광","price":220}]
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotes (id, customer_name, total_price, breakdown, created_at, user_id, deposit_paid, check_in_date, check_out_date, memo, deposit_amount, memo_images, eco_picks, assigned_by, user_memo) FROM stdin;
23	vungtausaver	220	{"golf": {"price": 0, "description": ""}, "guide": {"price": 0, "description": ""}, "total": 220, "villa": {"price": 0, "rooms": 1, "checkIn": "", "details": [], "checkOut": "", "villaName": ""}, "ecoGirl": {"price": 220, "details": ["2026-02-17: 12시간 x 1명 x $220 = $220"], "description": "1일"}, "vehicle": {"price": 0, "description": ""}, "fastTrack": {"price": 0, "description": ""}, "customCategories": []}	2026-02-16 18:35:44.63339	admin_vungtausaver	f	\N	\N		0	[]	[]	\N	
\.


--
-- Data for Name: saved_travel_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_travel_plans (id, user_id, title, purpose, start_date, end_date, plan_data, created_at) FROM stdin;
1	test-planner-user-1	미식가를 위한 붕따우 3일 미식 & 힐링 여행	gourmet	2026-02-10	2026-02-12	{"days": [{"day": 1, "date": "2026-02-10", "theme": "붕따우 도착과 현지 미식 탐험", "schedule": [{"lat": 10.344, "lng": 107.082, "note": "신선한 오징어, 새우 등이 들어간 현지 해산물 쌀국수 전문점", "time": "12:00", "type": "restaurant", "place": "해산물 쌀국수", "placeVi": "Old Man Cali - Hủ tiểu Mực", "activity": "붕따우 전통 해산물 쌀국수 점심", "isPartner": false, "travelTime": "호텔에서 차 10분", "discountText": "", "estimatedCost": 8}, {"lat": 10.327, "lng": 107.09, "note": "높이 32m, 811개 계단을 올라 아름다운 해안 전경 감상", "time": "13:30", "type": "attraction", "place": "붕따우 거대 예수상", "placeVi": "Tượng Chúa Kitô", "activity": "붕따우의 랜드마크, 거대 예수상 방문", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 2}, {"lat": 10.335, "lng": 107.088, "note": "시원한 에어컨과 다양한 음료로 잠시 쉬어가기 좋은 베트남 유명 카페 체인", "time": "15:30", "type": "cafe", "place": "KATINAT 커피", "placeVi": "KATINAT Coffee", "activity": "바다 전망의 쾌적한 카페에서 휴식", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 4}, {"lat": 10.336, "lng": 107.099, "note": "붕따우의 숨겨진 일몰 포토존, 연인들의 명소", "time": "16:30", "type": "viewpoint", "place": "돼지언덕", "placeVi": "Đồi Con Heo", "activity": "일몰 명소, 돼지언덕에서 인생샷 남기기", "isPartner": false, "travelTime": "차 5분", "discountText": "", "estimatedCost": 1}, {"lat": 10.34, "lng": 107.07, "note": "신선한 해산물 요리를 고급스러운 분위기에서 즐길 수 있는 곳", "time": "18:30", "type": "restaurant", "place": "해산물 고급 식당", "placeVi": "Gành Hào Seafood Restaurant", "activity": "고급 해산물 레스토랑에서 즐기는 저녁 식사", "isPartner": false, "travelTime": "차 15분", "discountText": "", "estimatedCost": 25}, {"lat": 10.345, "lng": 107.083, "note": "도깨비 협력업체, 붕따우 도깨비 카톡으로 예약 시 할인 혜택", "time": "20:00", "type": "massage", "place": "Re.en 마사지", "placeVi": "Re.en Massage", "activity": "피로를 풀어주는 럭셔리 마사지", "isPartner": true, "travelTime": "차 10분", "discountText": "붕따우 도깨비 카톡으로 예약 시 할인", "estimatedCost": 15}]}, {"day": 2, "date": "2026-02-11", "theme": "역사 탐방과 다채로운 미식의 즐거움", "schedule": [{"lat": 10.329, "lng": 107.082, "note": "프랑스 식민지 시대 건설된 등대로 붕따우 전경 조망", "time": "09:00", "type": "attraction", "place": "붕따우 등대", "placeVi": "Hải Đăng Vũng Tàu", "activity": "붕따우 시내를 한눈에, 붕따우 등대 방문", "isPartner": false, "travelTime": "호텔에서 차 10분", "discountText": "", "estimatedCost": 1}, {"lat": 10.35, "lng": 107.075, "note": "1898년 프랑스 총독의 여름 별장으로 아름다운 건축물과 정원", "time": "10:30", "type": "historical", "place": "화이트 펠리스(띠우 별장)", "placeVi": "Bạch Dinh (White Palace)", "activity": "프랑스 총독의 여름 별장, 화이트 펠리스", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 2}, {"lat": 10.346, "lng": 107.085, "note": "도깨비 협력식당, 예약 시 10% 할인 혜택 제공", "time": "12:30", "type": "restaurant", "place": "이안 돌판 삼겹살", "placeVi": "I-An Dolpan Samgyeopsal", "activity": "한국인의 입맛을 사로잡는 돌판 삼겹살", "isPartner": true, "travelTime": "차 10분", "discountText": "붕따우 도깨비 카톡으로 예약 시 10% 할인", "estimatedCost": 18}, {"lat": 10.337, "lng": 107.095, "note": "가장 긴 해변으로, 산책이나 가벼운 물놀이 즐기기 좋습니다.", "time": "14:30", "type": "beach", "place": "붕따우 백비치", "placeVi": "Bãi Sau", "activity": "아름다운 백비치에서 여유로운 시간", "isPartner": false, "travelTime": "차 5분", "discountText": "", "estimatedCost": 0}, {"lat": 10.339, "lng": 107.07, "note": "바다 전망이 아름다운 카페에서 시원한 음료와 함께 휴식", "time": "16:00", "type": "cafe", "place": "Coffee Suối Bên Biển", "placeVi": "Coffee Suối Bên Biển", "activity": "바다를 보며 즐기는 커피 타임", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 5}, {"lat": 10.338, "lng": 107.09, "note": "신선한 해산물을 합리적인 가격에 맛볼 수 있는 야시장 스타일 식당", "time": "18:30", "type": "restaurant", "place": "해산물 야시장 로컬식당", "placeVi": "Hải Sản Cô Thy 2", "activity": "활기찬 분위기의 해산물 야시장 로컬식당", "isPartner": false, "travelTime": "차 15분", "discountText": "", "estimatedCost": 15}, {"lat": 10.346, "lng": 107.081, "note": "현지인들에게 인기 있는 라이브 음악이 있는 비어클럽", "time": "20:30", "type": "club", "place": "88 비어클럽", "placeVi": "88 Beer Club", "activity": "라이브 음악과 함께 즐기는 비어클럽", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 15}]}, {"day": 3, "date": "2026-02-12", "theme": "현지 시장 체험과 여행의 마무리", "schedule": [{"lat": 10.337, "lng": 107.087, "note": "갓 잡은 신선한 해산물과 현지 시장의 활기찬 분위기를 느낄 수 있습니다.", "time": "09:30", "type": "shopping", "place": "붕따우 해산물 시장", "placeVi": "Seafood Market", "activity": "활기 넘치는 붕따우 해산물 시장 구경", "isPartner": false, "travelTime": "호텔에서 차 5분", "discountText": "", "estimatedCost": 0}, {"lat": 10.345, "lng": 107.087, "note": "붕따우의 명물인 바삭하고 고소한 반콧(Bánh Khọt) 전문 현지인 맛집", "time": "11:00", "type": "restaurant", "place": "꼬바붕따우 1호점", "placeVi": "Cô Ba Restaurant", "activity": "붕따우 대표 음식 '반콧'으로 브런치", "isPartner": false, "travelTime": "차 5분", "discountText": "", "estimatedCost": 7}, {"lat": 10.347, "lng": 107.077, "note": "다양한 현지 음식, 과일, 기념품 등을 구매할 수 있는 전통 시장", "time": "12:30", "type": "shopping", "place": "붕따우 시장", "placeVi": "Chợ Vũng Tàu 1985", "activity": "현지 특산품 및 기념품 쇼핑", "isPartner": false, "travelTime": "차 5분", "discountText": "", "estimatedCost": 0}, {"lat": 10.346, "lng": 107.08, "note": "도깨비 협력업체, 프리미엄 스파 서비스로 여행의 피로를 완벽하게 해소", "time": "14:00", "type": "massage", "place": "DAY SPA", "placeVi": "DAY SPA", "activity": "프리미엄 스파로 여행의 피로 마무리", "isPartner": true, "travelTime": "차 5분", "discountText": "붕따우 도깨비 카톡으로 예약 시 할인", "estimatedCost": 40}, {"lat": 10.818, "lng": 106.652, "note": "붕따우에서 호치민 공항까지 약 2시간 30분 소요", "time": "15:30", "type": "transfer", "place": "탄손녓 국제공항 (SGN)", "placeVi": "Sân bay Quốc tế Tân Sơn Nhất", "activity": "호치민 국제공항(SGN)으로 이동", "isPartner": false, "travelTime": "차 2시간 30분", "discountText": "", "estimatedCost": 0}]}], "tips": ["붕따우의 건기 시즌은 자외선이 강하므로 선크림, 모자, 선글라스를 꼭 챙겨주세요.", "로컬 식당에서는 '짜다(Trà đá, 아이스티)'를 주문하면 시원하게 식사를 즐길 수 있습니다.", "붕따우 도깨비 협력업체를 이용하시면 할인 혜택을 받을 수 있으니, 예약 전 문의하여 할인 코드를 확인하세요.", "택시 이동 시 그랩(Grab) 앱을 이용하면 편리하고 정찰제로 바가지요금을 피할 수 있습니다.", "해변가에서는 저녁에도 신선한 해산물을 맛볼 수 있는 포장마차나 로컬 식당이 많으니, 가볍게 둘러보며 경험해 보세요."], "title": "미식가를 위한 붕따우 3일 미식 & 힐링 여행", "summary": "붕따우의 숨겨진 맛집들을 탐방하고, 신선한 해산물과 현지 음식을 맛보며 미식의 즐거움을 만끽하는 3일간의 여정입니다. 주요 명소들을 둘러보면서도 여유로운 휴식과 편안한 마사지를 통해 여행의 피로를 풀고, 붕따우의 매력에 푹 빠져볼 수 있도록 구성했습니다. 아름다운 해변과 활기찬 시장, 그리고 맛있는 음식들이 가득한 붕따우에서 잊지 못할 추억을 만들어보세요.", "weatherNote": "2월은 붕따우의 건기 시즌으로, 맑고 쾌적한 날씨가 지속되어 야외 활동과 해변에서 시간을 보내기에 최적입니다. 한낮에는 다소 더울 수 있으나 습도가 낮아 불쾌감이 덜하며, 일교차가 크지 않아 쾌적한 여행을 즐기실 수 있습니다. 해변 활동과 야외 관광에 부담 없이 참여하실 수 있습니다.", "totalEstimatedCost": 158, "vehicleRecommendation": "이 일정은 붕따우 시내에서 총 약 2시간 20분 가량의 이동 시간이 필요합니다. 또한 호치민 공항까지의 왕복 이동 시간을 고려하면, 전 일정을 편안하게 소화하실 수 있도록 3~4인승 차량을 예약하여 전용 기사와 함께 이동하시는 것을 추천드립니다."}	2026-02-08 18:31:08.346062
2	admin_vungtausaver	붕따우 카지노 & 엔터테인먼트 3일	casino	2026-02-11	2026-02-13	{"days": [{"day": 1, "date": "2026-02-11", "theme": "해변에서의 휴식과 짜릿한 밤의 시작", "schedule": [{"lat": 10.346, "lng": 107.084, "note": "체크인 시간 확인", "time": "10:00", "type": "transfer", "place": "호텔", "placeVi": "Khách sạn", "activity": "붕따우 도착 및 체크인", "isPartner": false, "travelTime": "호치민 공항 출발", "discountText": "", "estimatedCost": 0}, {"lat": 10.339, "lng": 107.096, "note": "신선한 해산물 요리", "time": "12:00", "type": "restaurant", "place": "해산물 고급 식당", "placeVi": "Gành Hào Seafood Restaurant", "activity": "점심 식사 (현지 해산물)", "isPartner": false, "travelTime": "차 15분", "discountText": "", "estimatedCost": 15}, {"lat": 10.337, "lng": 107.095, "note": "수영, 일광욕, 해변 산책", "time": "14:00", "type": "beach", "place": "붕따우 백비치", "placeVi": "Bãi Sau", "activity": "붕따우 백비치에서의 여유로운 시간", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 0}, {"lat": 10.336, "lng": 107.097, "note": "바다를 바라보며 휴식", "time": "17:00", "type": "cafe", "place": "Mi Amor Beach", "placeVi": "Mi Amor Beach", "activity": "해변 카페에서 시원한 음료 즐기기", "isPartner": false, "travelTime": "도보 5분", "discountText": "", "estimatedCost": 4}, {"lat": 10.345, "lng": 107.08, "note": "도깨비 협력식당, 예약 시 10% 할인", "time": "19:00", "type": "koreanFood", "place": "이안 돌판 삼겹살", "placeVi": "I-an Korean BBQ", "activity": "저녁 식사 (한식)", "isPartner": true, "travelTime": "차 15분", "discountText": "붕따우 도깨비 카톡으로 예약 시 10% 할인", "estimatedCost": 20}, {"lat": 10.34412, "lng": 107.095049, "note": "외국인 전용 (여권 필수, 21세 이상)", "time": "21:00", "type": "casino", "place": "임페리얼 seaside 클럽", "placeVi": "Imperial Seaside Club", "activity": "카지노에서의 짜릿한 밤", "isPartner": true, "travelTime": "차 10분", "discountText": "붕따우 도깨비 카톡으로 문의 시 20불 바우처 지급 및 차량지원", "estimatedCost": 100}]}, {"day": 2, "date": "2026-02-12", "theme": "역사 탐방과 로맨틱한 저녁", "schedule": [{"lat": 10.327, "lng": 107.09, "note": "811개 계단, 붕따우 시내와 바다 조망", "time": "09:30", "type": "attraction", "place": "붕따우 거대 예수상", "placeVi": "Tượng Chúa Kitô", "activity": "붕따우 거대 예수상 방문", "isPartner": false, "travelTime": "차 20분", "discountText": "", "estimatedCost": 2}, {"lat": 10.34, "lng": 107.079, "note": "프랑스 식민지 시대 건축물", "time": "11:30", "type": "attraction", "place": "화이트 펠리스(띠우 별장)", "placeVi": "Bạch Dinh (White Palace)", "activity": "화이트 펠리스 (띠우 별장) 관람", "isPartner": false, "travelTime": "도보 15분", "discountText": "", "estimatedCost": 3}, {"lat": 10.345, "lng": 107.075, "note": "하노이 스타일의 맛있는 분짜", "time": "13:00", "type": "localFood", "place": "분짜 하노이", "placeVi": "Bún Chả Hà Nội", "activity": "점심 식사 (현지 분짜)", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 7}, {"lat": 10.342, "lng": 107.085, "note": "도깨비 협력업체", "time": "15:00", "type": "massage", "place": "Re.en 마사지", "placeVi": "Re.en Massage", "activity": "마사지로 피로 풀기", "isPartner": true, "travelTime": "차 15분", "discountText": "붕따우 도깨비 카톡으로 예약 시 할인", "estimatedCost": 15}, {"lat": 10.332, "lng": 107.088, "note": "붕따우 시내와 바다의 아름다운 일몰", "time": "18:00", "type": "viewpoint", "place": "돼지언덕", "placeVi": "Đồi Con Heo", "activity": "돼지 언덕에서 로맨틱한 일몰 감상", "isPartner": false, "travelTime": "차 20분", "discountText": "", "estimatedCost": 0}, {"lat": 10.348, "lng": 107.078, "note": "활기찬 야시장 분위기에서 신선한 해산물 즐기기", "time": "20:00", "type": "localFood", "place": "해산물 야시장 로컬식당", "placeVi": "Hải Sản Cô Thy 2", "activity": "저녁 식사 (해산물 야시장)", "isPartner": false, "travelTime": "차 20분", "discountText": "", "estimatedCost": 18}, {"lat": 10.349345, "lng": 107.074998, "note": "외국인 전용 (여권 필수, 21세 이상)", "time": "22:00", "type": "casino", "place": "Monaco casino", "placeVi": "Monaco Casino", "activity": "Monaco Casino에서 행운 시험", "isPartner": true, "travelTime": "차 15분", "discountText": "붕따우 도깨비 카톡으로 문의시 50불 바우처 지급", "estimatedCost": 150}]}, {"day": 3, "date": "2026-02-13", "theme": "붕따우 명소 방문 및 출국", "schedule": [{"lat": 10.329, "lng": 107.082, "note": "프랑스 식민지 시대 건축물, 붕따우 전경 조망", "time": "09:00", "type": "attraction", "place": "붕따우 등대", "placeVi": "Hải Đăng Vũng Tàu", "activity": "붕따우 등대 방문", "isPartner": false, "travelTime": "차 20분", "discountText": "", "estimatedCost": 2}, {"lat": 10.346, "lng": 107.076, "note": "베트남 대표 밥 요리", "time": "10:30", "type": "localFood", "place": "로컬 식당 (껌땀)", "placeVi": "Quán Cơm Tấm Lọ Lem", "activity": "점심 식사 (로컬 껌땀)", "isPartner": false, "travelTime": "차 15분", "discountText": "", "estimatedCost": 5}, {"lat": 10.347, "lng": 107.077, "note": "다양한 현지 특산품 및 기념품 구매", "time": "12:00", "type": "market", "place": "붕따우 시장", "placeVi": "Chợ Vũng Tàu 1985", "activity": "기념품 쇼핑", "isPartner": false, "travelTime": "차 10분", "discountText": "", "estimatedCost": 0}, {"lat": 10.819, "lng": 106.654, "note": "출국 시간 고려", "time": "13:30", "type": "transfer", "place": "호치민 공항", "placeVi": "Sân bay Tân Sơn Nhất", "activity": "호치민 공항으로 이동", "isPartner": false, "travelTime": "차 2시간 30분", "discountText": "", "estimatedCost": 0}]}], "tips": ["붕따우 카지노는 외국인 전용이며, 입장 시 여권과 21세 이상임을 증명해야 합니다.", "카지노 방문 시, 붕따우 도깨비 카톡으로 문의하면 바우처나 차량 지원 등 특별 혜택을 받을 수 있습니다.", "건기 시즌(11월~4월)은 날씨가 좋아 야외 활동에 최적입니다. 낮에는 햇볕이 강할 수 있으니 선크림과 모자를 준비하세요.", "붕따우의 밤문화(라이브 바, 클럽)는 늦은 시간에 활기를 띱니다. 안전을 위해 일행과 함께 이동하고, 귀중품 관리에 유의하세요.", "붕따우에서는 Grab 앱을 통해 편리하게 차량을 호출할 수 있습니다. 가까운 거리는 오토바이 택시도 이용 가능합니다."], "title": "붕따우 카지노 & 엔터테인먼트 3일", "summary": "붕따우에서의 짜릿한 카지노 경험과 함께 현지 엔터테인먼트를 즐기는 3일 일정입니다. 아름다운 해변과 랜드마크를 둘러보며 밸런스 있는 휴식과 관광을 만끽하세요. 건기 시즌의 쾌적한 날씨 속에서 잊지 못할 추억을 만들어 보세요.", "weatherNote": "11월부터 4월까지 이어지는 건기 시즌은 붕따우 여행에 최적입니다. 맑고 건조한 날씨 덕분에 해변에서의 물놀이, 야외 관광, 그리고 저녁 시간의 활동 모두 쾌적하게 즐길 수 있습니다.", "totalEstimatedCost": 485, "vehicleRecommendation": "이 일정은 총 4시간 이동이 필요합니다. 7인승 차량 예약을 추천드립니다."}	2026-02-08 19:41:04.770507
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
keHFaCXk8MVhFKOvaSEkPkXSO5PppZLn	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-23T19:00:14.246Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "returnTo": "https://6a5540ae-c3ef-4c6c-baff-595e54654c2c-00-3g0todzsal02s.spock.replit.dev/"}	2026-02-23 19:00:15
8qcn82YOzqWvUHD97DUYYBaWQyeC_wzf	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-11T14:23:17.127Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2026-02-18 10:25:04
1VRlhSNIhk48Vu6T-jzVQlGgIVtvWQMt	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-14T06:35:14.466Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "returnTo": "https://6a5540ae-c3ef-4c6c-baff-595e54654c2c-00-3g0todzsal02s.spock.replit.dev/"}	2026-02-14 06:35:15
YVq_2-mAinqI5VozqsNTJGglBLbfi9Qk	{"user": {"id": "admin_vungtausaver", "name": "vungtausaver", "email": "vungtausaver@admin.local", "profileImageUrl": null}, "cookie": {"path": "/", "secure": true, "expires": "2026-02-22T02:24:10.663Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "userId": "admin_vungtausaver"}	2026-02-23 18:35:54
lgTRJl3aGFdPJ3DUlJJlpRjsMM4ak1M9	{"user": {"id": "admin_vungtausaver", "name": "vungtausaver", "email": "vungtausaver@admin.local", "profileImageUrl": null}, "cookie": {"path": "/", "secure": true, "expires": "2026-02-12T07:09:23.924Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "userId": "admin_vungtausaver"}	2026-02-19 06:35:07
ItB0s77UEbDD4wVFDNTVhNcm-DrDSOAp	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-15T18:29:22.872Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6a5540ae-c3ef-4c6c-baff-595e54654c2c", "exp": 1770578962, "iat": 1770575362, "iss": "https://test-mock-oidc.replit.app/", "jti": "8f6d939215721cae876aae1d7454eb3e", "sub": "test-planner-user-1", "email": "planner@test.com", "auth_time": 1770575362, "last_name": "Planner", "first_name": "Test"}, "expires_at": 1770578962, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzcwNTc1MzYyLCJleHAiOjE3NzA1Nzg5NjIsInN1YiI6InRlc3QtcGxhbm5lci11c2VyLTEiLCJlbWFpbCI6InBsYW5uZXJAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiVGVzdCIsImxhc3RfbmFtZSI6IlBsYW5uZXIifQ.EO_M9uqd568_ujVgWEgICrlFBIJeyCP7hF5pSv2pD_kyBXpYcbQK42i9sK9dSQJ15Keuyc0bJjl9iEL3GT97zrjVOtHvSfmL3RbwQM6thBSwZ22_Grjv_P1BLdHe83Cs5zSs0OQVrB-htq2dun1ydS54xs2ofYJPT--iUafEe2Xk92vvrK3XLYTMNCTZ-dIaSVju7uO-nP2OFRz0i0gXHBuRGcdLFTPclUQntrbWRnY_WR1CGAlHhST3sNWpCc4Q-LSSoSpSX1Tag3B_SHvzgUCMmDwcTbUjU1eC5MYsN7c655jI711B4RZ_FAy77UPI4XQ25axD4UKpn1tjsSCeAw", "refresh_token": "eyJzdWIiOiJ0ZXN0LXBsYW5uZXItdXNlci0xIiwiZW1haWwiOiJwbGFubmVyQHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IlRlc3QiLCJsYXN0X25hbWUiOiJQbGFubmVyIn0"}}}	2026-02-15 18:32:25
JC2hmNCY3M2eVV8fLdZ0jFBPUmd5bpOf	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-15T19:04:29.639Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6a5540ae-c3ef-4c6c-baff-595e54654c2c", "exp": 1770581069, "iat": 1770577469, "iss": "https://test-mock-oidc.replit.app/", "jti": "8c4fc55be6424594329f93c83f8e1606", "sub": "chattest-user-7788", "email": "chattest7788@example.com", "auth_time": 1770577469, "last_name": "Tester", "first_name": "Chat"}, "expires_at": 1770581069, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzcwNTc3NDY5LCJleHAiOjE3NzA1ODEwNjksInN1YiI6ImNoYXR0ZXN0LXVzZXItNzc4OCIsImVtYWlsIjoiY2hhdHRlc3Q3Nzg4QGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkNoYXQiLCJsYXN0X25hbWUiOiJUZXN0ZXIifQ.YbBFKV87nO6mdg3ITjFzjOHmG3yDg3CMw62gvr8hGNauVdbANoi4Pl1GRGLG535jbQX7lUj7YCnIoQF9bUimrdUrc8pGbSKbBxxlzqVMVQD97Amk6bvfRpuGkvm2ZFCtPCZBAvkvPjEWpCgTwsBnyx7rwTM54zanBezWjJc7uJOP6XGHbE9zSl7ES1MIjb3a8014TBHuj8DTYZTg3kvaaqliABVDEskkHYa0XoveX-hwuQc67cFc18OhZxFQnSCZ6k7leQF21P9D0F3g9m_NxL3bekDAOg8YQDM3QY_nZGjqpGj-kHMDiSNeca6hb3nT7rPrx8mA-MnZHmUK0cXagQ", "refresh_token": "eyJzdWIiOiJjaGF0dGVzdC11c2VyLTc3ODgiLCJlbWFpbCI6ImNoYXR0ZXN0Nzc4OEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJDaGF0IiwibGFzdF9uYW1lIjoiVGVzdGVyIn0"}}}	2026-02-15 19:05:06
\.


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shop_products (id, name, brand, price, quantity, description, image, images, benefits, ingredients, usage, caution, gradient, is_active, sort_order, created_at, updated_at) FROM stdin;
1	다이어트 커피	Pluscoffee Diet	45000	15개 (15일분)			{}	{"체중 감량 지원","신진대사 촉진","자연 디톡스"}	녹차, 흰콩, L-카르니틴, DNF-10(효모 추출물), 인스턴트 커피, 코코아 분말, 코코넛 밀크 분말, 덱스트로스, 이눌린 섬유, 비유제품 크리머	아침식사 전 뜨거운물 50ML와 함께 1포를 물에 타서 섭취	임산부, 본 제품의 성분에 민감하거나 금기사항이 있는 사람은 사용하지 마십시오.	from-amber-500 to-orange-600	t	1	2026-02-15 02:34:40.827625	2026-02-15 02:34:40.827625
2	고디톡스	Go Detox	38000	28알			{}	{"자연 디톡스","체중 관리","피부 개선"}	복령 100mg, 연잎 100mg, 가르시니아 캄보지아 80mg, 은행 60mg, 사과식초 추출물 60mg, L-carnitine 40mg, Collagen 20mg	1일째 아침 공복에 1알, 2일째 아침 공복에 1알, 3일째부터 아침 공복에 2알씩	하루에 2.5~3리터의 물을 마셔주세요. 음용중에는 각성제 섭취를 자제해 주세요.	from-emerald-500 to-teal-600	t	2	2026-02-15 02:34:40.827625	2026-02-15 02:34:40.827625
3	고커피	MAX HEALTH Go Coffee	40000	12포			{}	{"에너지 증진","체중 감량","자연 성분"}	비유제품 크리머 분말, 인스턴트 커피, 녹색 영지 추출물 분말, 추출물, 말토덱스트린, 추출물 등	따뜻하게 마시기: 뜨거운 물 70ML에 커피 1~2포를 녹여 드세요. 시원하게 마시기: 뜨거운 물 70ML에 커피 2팩을 섞어준 후 얼음을 넣어 드세요.	하루에 2.5~3리터의 물을 마셔주세요. 음용중에는 각성제 섭취를 자제해 주세요.	from-gray-700 to-gray-900	t	3	2026-02-15 02:34:40.827625	2026-02-15 02:34:40.827625
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_settings (id, key, value, updated_at) FROM stdin;
1	hero_title	베트남 붕따우 도깨비	2026-02-07 06:47:26.701451
2	hero_subtitle		2026-02-07 06:47:27.016426
3	hero_description		2026-02-07 06:47:27.321701
4	seo_title		2026-02-07 06:47:27.567348
5	seo_description		2026-02-07 06:47:27.837407
6	seo_keywords		2026-02-07 06:47:28.048468
\.


--
-- Data for Name: user_coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_coupons (id, user_id, coupon_id, is_used, used_at, issued_at) FROM stdin;
1	test-user-PKMUSD	1	f	\N	2026-02-04 06:01:05.190524
2	admin_vungtausaver	2	t	2026-02-04 14:56:58.557	2026-02-04 14:48:35.491472
3	admin_vungtausaver	1	f	\N	2026-02-04 14:57:42.383402
4	admin_vungtausaver	2	f	\N	2026-02-05 08:31:24.484799
5	admin_vungtausaver	2	f	\N	2026-02-11 10:27:17.866414
\.


--
-- Data for Name: user_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_locations (id, nickname, latitude, longitude, place_name, place_category, message, expires_at, created_at) FROM stdin;
9	ㄹㅊㄱ	10.3666312	107.0924721	\N	\N	현재 여기 있어요!	2026-01-23 10:18:03.742	2026-01-22 10:18:03.747819
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at, gender, nickname, birth_date, password, login_method, email_verified, email_verification_token, email_verification_expires, welcome_coupon_issued, is_admin, can_view_nightlife18, can_view_eco) FROM stdin;
test-user-PKMUSD	testuserEE8CQ0@example.com	Test	User	\N	2026-01-15 18:02:55.777993	2026-01-15 18:02:55.777993	\N	\N	\N	\N	\N	f	\N	\N	f	f	f	f
test-user-4srzJn	testuserlPNiBt@example.com	Test	User	\N	2026-01-15 18:05:10.986015	2026-01-15 18:05:10.986015	\N	\N	\N	\N	\N	f	\N	\N	f	f	f	f
test-user-edit-2Ft2Io	editusersMVLYI@example.com	Edit	Tester	\N	2026-01-15 18:22:15.684951	2026-01-15 18:22:15.684951	\N	\N	\N	\N	\N	f	\N	\N	f	f	f	f
test-planner-user-1	planner@test.com	Test	Planner	\N	2026-02-08 18:29:22.857874	2026-02-08 18:29:22.857874	\N	\N	\N	\N	\N	f	\N	\N	f	f	f	f
42663365	soulcounter486@gmail.com	붕따우도깨비	\N	\N	2026-01-15 18:09:28.883228	2026-02-09 07:29:11.466	\N	붕따우 도깨비	\N	\N	\N	f	\N	\N	f	t	f	f
chattest-user-7788	chattest7788@example.com	Chat	Tester	\N	2026-02-08 19:04:29.629033	2026-02-09 07:29:13.783	\N	\N	\N	\N	\N	f	\N	\N	f	f	f	f
1a33abe0-1b92-4336-abf8-baee3988ea09	testuser_ao3EU0@example.com	\N	\N	\N	2026-02-04 08:42:33.396728	2026-02-04 08:42:33.396728	\N	Tester	\N	$2b$10$WEMvJqhtaAvZXck/7/yPCuufPDXVCEB40KjM7UYmktbUZ1XjsPWfq	email	f	763642	2026-02-04 09:12:33.395	f	f	f	f
0b08e982-87b6-41f5-b936-42ad80aac008	testuser123@example.com	\N	\N	\N	2026-02-04 08:44:21.737156	2026-02-04 08:44:21.737156	\N	testuser	\N	$2b$10$B08BCJPWZy.AcdTNAc384O.bqsndlfSTAsP26wPObv7c9SuJ0.5Ai	email	t	\N	\N	f	f	f	f
admin_vungtausaver	vungtausaver@admin.local	\N	\N	\N	2026-02-04 14:10:20.064965	2026-02-04 14:10:20.064965	\N	vungtausaver	\N	$2b$10$KK4BuIG8ec/4iLUANJlvMeZEtTG7THOcGzq7zS6cAM5HK3qMi.0WG	email	t	\N	\N	t	t	f	f
bcb6a882-e7e2-432f-bac4-41debb9448b1	testuser456@example.com	\N	\N	\N	2026-02-04 08:44:44.657846	2026-02-05 05:34:32.492	\N	testuser456	\N	$2b$10$Oe9rBKFIFUuEZiKbnZzIQ.u0LMOtsp5ACTaSU2M82hi7Vob36Fi32	email	f	495891	2026-02-04 09:14:44.656	f	f	f	f
b5a4666f-8dcf-4b5f-b0ae-ecedaab90571	d2271347@gmail.com	\N	\N	\N	2026-02-05 07:09:48.274693	2026-02-05 07:09:48.274693	male	d2271347	\N	$2b$10$xVoeNLGCuqb2B8Rmm55yruO7JFt7pommCcKwKmCLEQLe4O2CHrYwS	email	f	973643	2026-02-05 07:39:48.273	f	f	f	f
\.


--
-- Data for Name: villas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.villas (id, name, main_image, images, weekday_price, friday_price, weekend_price, latitude, longitude, address, notes, is_active, sort_order, created_at, updated_at, holiday_price, map_url, max_guests, bedrooms, amenities, is_best) FROM stdin;
14	ㅁㄴㄴ	/api/public-images/villa_1769855707422_e4z0ml.jpg	["/api/public-images/villa_1769855707422_e4z0ml.jpg"]	350	380	500	10.353744	107.099936			t	0	2026-01-31 10:35:32.266818	2026-01-31 17:44:49.181	550	https://maps.app.goo.gl/A2CecW2wSJ95oD3o6	10	3	["outskirts", "karaoke", "livingAC"]	f
16	ㄱㄱ	/api/public-images/villa_1769859064061_nqem4n.jpg	["/api/public-images/villa_1769859064061_nqem4n.jpg"]	350	380	500					t	0	2026-01-31 11:31:37.121156	2026-01-31 11:31:37.121156	550		10	3	[]	f
17	ㅁㅁ	/api/public-images/villa_1769859116928_0jkdek.jpg	["/api/public-images/villa_1769859116928_0jkdek.jpg"]	350	380	500	10.347417	107.085884			t	0	2026-01-31 11:32:02.695721	2026-01-31 11:32:02.695721	550		10	3	[]	f
19	ㅅㅅ	/api/public-images/villa_1769859282883_qrengc.jpg	["/api/public-images/villa_1769859282883_qrengc.jpg"]	350	380	500	10.353057	107.079026			t	0	2026-01-31 11:34:53.611023	2026-01-31 11:34:53.611023	550		10	3	[]	f
20	ㅁㅁ	/api/public-images/villa_1769859309302_sbtgwa.jpg	["/api/public-images/villa_1769859309302_sbtgwa.jpg"]	350	380	500	10.349275	107.093685			t	0	2026-01-31 11:35:14.770423	2026-01-31 11:35:14.770423	550		10	3	[]	f
18	ㅁㅁ	/api/public-images/villa_1769859264185_lfaoc.jpg	["/api/public-images/villa_1769859264185_lfaoc.jpg"]	600	380	500	10.339463	107.078169			t	0	2026-01-31 11:34:30.302267	2026-01-31 11:50:25.266	550		10	3	[]	f
15	ㅇㅇ	/api/public-images/villa_1769859035365_arnnwx.jpg	["/api/public-images/villa_1769859035365_arnnwx.jpg"]	100	380	500	10.350862	107.095320			t	0	2026-01-31 11:30:49.243789	2026-01-31 11:50:47.793	550		10	3	[]	f
\.


--
-- Data for Name: visitor_count; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visitor_count (id, count, last_reset_date, total_count, real_count, real_total_count) FROM stdin;
1	897	2026-02-18	37544	1	511
\.


--
-- Name: admin_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_messages_id_seq', 1, false);


--
-- Name: admin_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_notifications_id_seq', 3, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 3, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 3, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 1, false);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coupons_id_seq', 2, true);


--
-- Name: customer_chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_chat_messages_id_seq', 5, true);


--
-- Name: customer_chat_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_chat_rooms_id_seq', 11, true);


--
-- Name: eco_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eco_profiles_id_seq', 1, false);


--
-- Name: expense_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_groups_id_seq', 12, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 29, true);


--
-- Name: instagram_synced_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.instagram_synced_posts_id_seq', 10, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.places_id_seq', 51, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 21, true);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- Name: quote_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quote_categories_id_seq', 7, true);


--
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotes_id_seq', 23, true);


--
-- Name: saved_travel_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_travel_plans_id_seq', 2, true);


--
-- Name: shop_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shop_products_id_seq', 3, true);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 6, true);


--
-- Name: user_coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_coupons_id_seq', 5, true);


--
-- Name: user_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_locations_id_seq', 9, true);


--
-- Name: villas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.villas_id_seq', 20, true);


--
-- Name: visitor_count_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visitor_count_id_seq', 1, false);


--
-- Name: admin_messages admin_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customer_chat_messages customer_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_chat_messages
    ADD CONSTRAINT customer_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: customer_chat_rooms customer_chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_chat_rooms
    ADD CONSTRAINT customer_chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: eco_profiles eco_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eco_profiles
    ADD CONSTRAINT eco_profiles_pkey PRIMARY KEY (id);


--
-- Name: expense_groups expense_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_groups
    ADD CONSTRAINT expense_groups_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: instagram_synced_posts instagram_synced_posts_instagram_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instagram_synced_posts
    ADD CONSTRAINT instagram_synced_posts_instagram_id_unique UNIQUE (instagram_id);


--
-- Name: instagram_synced_posts instagram_synced_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instagram_synced_posts
    ADD CONSTRAINT instagram_synced_posts_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: place_categories place_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.place_categories
    ADD CONSTRAINT place_categories_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: quote_categories quote_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_categories
    ADD CONSTRAINT quote_categories_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: saved_travel_plans saved_travel_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_travel_plans
    ADD CONSTRAINT saved_travel_plans_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: shop_products shop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_unique UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: user_coupons user_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coupons
    ADD CONSTRAINT user_coupons_pkey PRIMARY KEY (id);


--
-- Name: user_locations user_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_locations
    ADD CONSTRAINT user_locations_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: villas villas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.villas
    ADD CONSTRAINT villas_pkey PRIMARY KEY (id);


--
-- Name: visitor_count visitor_count_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitor_count
    ADD CONSTRAINT visitor_count_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Jvm3ZFgsl9IbmrdFwzyhXzJq8TdhgGTXJVa6B07chf1JvRDG8DvSU0m8IBnsXzS

