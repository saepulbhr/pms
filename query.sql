-- Table: public.users

-- DROP TABLE public.users;

CREATE TABLE public.users
(
    userid integer NOT NULL DEFAULT nextval('users_userid_seq'::regclass),
    email text COLLATE pg_catalog."default",
    password text COLLATE pg_catalog."default",
    firstname character varying(50) COLLATE pg_catalog."default",
    lastname character varying(50) COLLATE pg_catalog."default",
    CONSTRAINT userid PRIMARY KEY (userid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.users
    OWNER to postgres;



-- Table: public.projects

-- DROP TABLE public.projects;

CREATE TABLE public.projects
(
    projectid integer NOT NULL DEFAULT nextval('projects_projectid_seq'::regclass),
    name text COLLATE pg_catalog."default",
    CONSTRAINT projectid PRIMARY KEY (projectid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.projects
    OWNER to postgres;


-- Table: public.members

-- DROP TABLE public.members;

CREATE TABLE public.members
(
    id integer NOT NULL DEFAULT nextval('members_id_seq'::regclass),
    userid integer,
    role character varying COLLATE pg_catalog."default",
    projectid integer,
    CONSTRAINT id PRIMARY KEY (id),
    CONSTRAINT projectid FOREIGN KEY (id)
        REFERENCES public.projects (projectid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT userid FOREIGN KEY (id)
        REFERENCES public.users (userid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.members
    OWNER to postgres;


-- Table: public.issues

-- DROP TABLE public.issues;

CREATE TABLE public.issues
(
    issueid integer NOT NULL DEFAULT nextval('issues_issueid_seq'::regclass),
    projectid integer,
    tracker character varying(20) COLLATE pg_catalog."default" NOT NULL,
    subject text COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default" NOT NULL,
    priority character varying COLLATE pg_catalog."default" NOT NULL,
    assignee integer,
    startdate date,
    duedate date,
    estimatedtime integer,
    done character varying COLLATE pg_catalog."default",
    file text COLLATE pg_catalog."default",
    spenttime integer,
    targetversion integer,
    author integer,
    createddate date,
    updateddate date,
    closeddate date,
    parenttask integer,
    CONSTRAINT issueid PRIMARY KEY (issueid),
    CONSTRAINT assignee FOREIGN KEY (issueid)
        REFERENCES public.users (userid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT author FOREIGN KEY (issueid)
        REFERENCES public.users (userid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT parenttask FOREIGN KEY (issueid)
        REFERENCES public.issues (issueid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT projectid FOREIGN KEY (issueid)
        REFERENCES public.projects (projectid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.issues
    OWNER to postgres;


-- Table: public.activity

-- DROP TABLE public.activity;

CREATE TABLE public.activity
(
    activityid integer NOT NULL DEFAULT nextval('activity_activityid_seq'::regclass),
    "time" date,
    title text COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    author character varying(30) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.activity
    OWNER to postgres;