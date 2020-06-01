DROP DATABASE IF EXISTS airbnb;

CREATE DATABASE airbnb;

GRANT ALL PRIVILEGES ON DATABASE airbnb TO postgres;

\c airbnb;

CREATE TABLE rooms (
  room_id SERIAL NOT NULL PRIMARY KEY,
  nightly_rate MONEY NOT NULL,
  person_capacity SMALLINT NOT NULL,
  tax NUMERIC(4, 2) NOT NULL
);

CREATE TABLE reservations (
  reservation_id INT NOT NULL PRIMARY KEY,
  room_id SERIAL NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  cost MONEY NOT NULL
);
