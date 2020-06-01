// global constant variable to access execution start time
const exec_time_init = Date.now();

// import modules
const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

// promisify fs appendFile method
const appendFile = Promise.promisify(fs.appendFile);

// global counter to compute sum of write times
let write_time = 0;

const logger = (writer, time_init, time_final, rooms, reservations_per_room, num_partitions) => {
  const time_delta = Math.abs(time_final - time_init) / 1000;
  write_time += time_delta;
  const num_records = (rooms * reservations_per_room) / num_partitions;
  const speed = num_records / time_delta;

  const statistics = `
\tFile: ${writer.path}
\tNo. Records: ${num_records.toFixed(3)}
\tWrite Time: ${time_delta.toFixed(3)} seconds
\tWrite Speed: ${speed.toFixed(3)} records/second
`;

  return statistics;
};

const generate_csv = (write_streams, num_partitions, encoding, callback) => {
  /* random data initialization */
  const rooms = 10_000_000;
  const reservations_per_room = 10;
  const fields = ['reservation_id', 'room_id', 'check_in', 'check_out', 'cost'];
  const person_capacity = _.range(1, 16 + 1); // 1 to 16 inclusive
  const nightly_rate = _.range(50, 201, 5);
  const tax_rate = _.range(0, 10).reduce((accum, whole) => { // 0.00 to 9.75 in 0.25 increments; 40 elements
    [0.00, 0.25, 0.50, 0.75].forEach((fract) => {
      accum.push(whole + fract);
    });

    return accum;
  }, []);
  const two_weeks_in_milliseconds = 2 * 7 * 24 * 60 * 60 * 10 ** 3;
  const two_weeks_in_days = 2 * 7;
  const two_hours_in_milliseconds = 2 * 60 * 60 * 10 ** 3;

  // variable to know when to halt do-while loop execution
  const stop = rooms * reservations_per_room;

  // variable to know when to increment room_id
  let rotate = 0;

  // start indices
  let room_id = 1;
  let reservation_id = 0;
  let night_index = 0;
  let tax_index = 0;
  let person_index = 0;
  let stream_index = 0;

  // initialize first check_in 
  let check_in = new Date();

  // initialize variable to log statistics of each paritioned file
  let logs = '';
  
  // initialize first write stream
  let writer = write_streams[stream_index];
  
  // start first write 
  let time_init = Date.now();
  writer.write(`${fields}\n`, encoding);

  const write = () => {
    let ok = true;
    do {
      reservation_id += 1;
      rotate += 1;

      let check_out = new Date(check_in.valueOf() + two_weeks_in_milliseconds);
      let multiplier = person_capacity[person_index] > 1 ? [1.0, 1.15][_.random(0, 1)] : 1.0; // e.g. Adults only, Adults + Children
      let cost = (nightly_rate[night_index] * two_weeks_in_days * multiplier * (1 + tax_rate[tax_index] * 10 ** -2)).toFixed(2);

      data = `${reservation_id},${room_id},${check_in.toISOString()},${check_out.toISOString()},${cost}\n`;
      check_in = new Date(check_out.valueOf() + two_hours_in_milliseconds);

      // increment room_id
      if (rotate === reservations_per_room) {
        rotate = 0;
        room_id += 1;
        night_index += 1;
        tax_index += 1;
        person_index += 1;
        check_in = new Date();
      }

      // reset night index
      if (night_index === nightly_rate.length) {
        night_index = 0;
      }

      // reset tax index
      if (tax_index === tax_rate.length) {
        tax_index = 0;
      }

      // reset person index
      if (person_index === person_capacity.length) {
        person_index = 0;
      } 

      if (reservation_id === stop) {
        // log statistics for last stream
        const time_final = Date.now();
        logs += logger(writer, time_init, time_final, rooms, reservations_per_room, num_partitions);

        writer.write(data, encoding, callback(writer, logs, rooms, reservations_per_room, fields));
      } else {
        ok = writer.write(data, encoding);
      }

      // partition csv file
      if (
        // reservation_id === stop * (1 / num_partitions) || reservation_id === stop * (2 / num_partitions)
        // || reservation_id === stop * (3 / num_partitions) || reservation_id === stop * (4 / num_partitions)
        // || reservation_id === stop * (5 / num_partitions) || reservation_id === stop * (6 / num_partitions)
        // || reservation_id === stop * (7 / num_partitions) || reservation_id === stop * (8 / num_partitions)
        // || reservation_id === stop * (9 / num_partitions)
        stream_index + 1 !== num_partitions
        && reservation_id === stop * ((stream_index + 1) / num_partitions)
      ) {
        // log statistics for current stream
        const time_final = Date.now();
        logs += logger(writer, time_init, time_final, rooms, reservations_per_room, num_partitions);

        // get next write stream
        stream_index += 1;
        writer = write_streams[stream_index];

        // reset start time
        time_init = Date.now();

        // initialize headers
        writer.write(`${fields}\n`, encoding);
      }

    } while (reservation_id < stop && ok);
    if (reservation_id < stop) {
      writer.once('drain', write);
    }
  };

  write();

};

const callback = (writer, logs, rooms, reservations_per_room, fields) => {
  // execution stop time
  const exec_time_final = Date.now();
  
  // execution time
  const exec_time_delta = Math.abs(exec_time_final - exec_time_init) / 1000;
  
  const date = new Date().toDateString();
  const time_o_clock = new Date(exec_time_final).toTimeString();
  const num_records = rooms * reservations_per_room;
  const speed = num_records / write_time; 
  const statistics = `Files:
${logs}
Date: ${date}
Time: ${time_o_clock}
No. Fields: ${fields.length}
No. Records: ${num_records}
Write Time: ${write_time.toFixed(3)} seconds
Write Speed: ${speed.toFixed(3)} records/second
Execution Time: ${exec_time_delta.toFixed(3)} seconds
\n\n\n\n\n`;

  // output statistics to terminal
  console.log(statistics);

  // create log file
  const log_file = path.join(__dirname, './csvs/logs/reservations.log');

  // write statistics to log file
  appendFile(log_file, statistics, 'utf8')
    .then(() => console.log('Done'))
    .catch(console.error);


  // close last write stream
  return () => {
    writer.end();
  };
};

/* csv file configuration */

// number of csv files to generate
const num_partitions = 10; 

// write streams
const write_streams = _.range(1, num_partitions + 1).map((file_number) => fs.createWriteStream(path.join(__dirname, `./csvs/reservations${file_number}.csv`)));

// encoding
const encoding = 'utf8';

generate_csv(write_streams, num_partitions, encoding, callback);
