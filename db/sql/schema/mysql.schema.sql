DROP DATABASE IF EXISTS airbnb;

CREATE DATABASE airbnb;

USE airbnb;

CREATE TABLE rooms (
  room_id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nightly_rate SMALLINT UNSIGNED NOT NULL,
  person_capacity TINYINT UNSIGNED NOT NULL,
  tax DECIMAL(4, 2) UNSIGNED NOT NULL,
  PRIMARY KEY (room_id)
);

CREATE TABLE reservations (
  reservation_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id MEDIUMINT UNSIGNED NOT NULL,  
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total DECIMAL(8, 2) UNSIGNED NOT NULL,
  PRIMARY KEY (reservation_id), 
  FOREIGN KEY (room_id)
    REFERENCES rooms(room_id)
    ON DELETE CASCADE
);

CREATE INDEX reservations_room_id_check_in_check_out_idx ON reservations (room_id, check_in ASC, check_out); -- For SELECT-WHERE queries (order matters): sorts data first by room_id, check_in, then check_out
CREATE UNIQUE INDEX reservations_room_id_check_in ON reservations (room_id, check_in); -- For INSERT queries: data integrity
CREATE UNIQUE INDEX reservations_room_id_check_out ON reservations (room_id, check_out);

-- INDEX DATES and maybe multiple things?
-- https://dev.mysql.com/doc/refman/5.7/en/create-table-foreign-keys.html#foreign-key-examples
