// global constant variable to access execution start time
const exec_time_init = Date.now();

// import modules
const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

// promisify fs writeFile, appendFile methods
const writeFile = Promise.promisify(fs.writeFile);
const appendFile = Promise.promisify(fs.appendFile);

/* random data initialization */
const rooms = 10_000_000; // # of rooms
const fields = ['room_id', 'nightly_rate', 'person_capacity', 'tax'];
const nightly_rate = _.range(50, 201, 5);  // random nightly rates; 50 to 200 inclusive; increments of 5; 31 elements
const person_capacity = _.range(1, 16 + 1); // 1 to 16 inclusive
const tax_rate = _.range(0, 10).reduce((accum, whole) => { // 0.00 to 9.75 in 0.25 increments; 40 elements
  [0.00, 0.25, 0.50, 0.75].forEach((fract) => {
    accum.push(whole + fract);
  });

  return accum;
}, []);

// initialize start indices and stop indices
let night_index = 0; const night_len = nightly_rate.length;
let person_index = 0; const person_len = person_capacity.length;
let tax_index = 0; const tax_len = tax_rate.length;

// initialize data
let data = `${fields}\n`;

// accumulate data
for (let room_id = 1; room_id <= rooms; room_id++) {
  // control indices
  night_index = night_index === night_len ? 0 : night_index;
  person_index = person_index === person_len ? 0 : person_index;
  tax_index = tax_index === tax_len ? 0 : tax_index;

  // concate data
  data += `${room_id},${nightly_rate[night_index]},${person_capacity[person_index]},${tax_rate[tax_index]}\n`;
  
  // increment indices
  night_index += 1;
  person_index += 1;
  tax_index += 1;
}

// csv file configuration
const csv_file = path.join(__dirname, './csvs/rooms.csv');
const encoding = 'utf8';

// write to csv file
writeFile(csv_file, data, encoding)
  .then(() => {
    // statistics
    const exec_time_final = Date.now();
    const exec_time_delta = Math.abs(exec_time_final - exec_time_init) / 1000;
    const date = new Date().toDateString();
    const time_o_clock = new Date(exec_time_final).toTimeString();
    const statistics = `File: ${csv_file}
Date: ${date}
Time: ${time_o_clock}
Number of Fields: ${fields.length}
Number of Records: ${rooms}
Write Speed: ${exec_time_delta} seconds
Write Rate: ${(rooms) / exec_time_delta} records/second
\n`;

    // output statistics to terminal
    console.log(statistics);

    // create log file
    const log_file = path.join(__dirname, './csvs/logs/rooms.log');

    // write statistics to log file
    appendFile(log_file, statistics, encoding)
      .then(() => console.log('Done'))
      .catch(console.error);
  })
  .catch((err) => {
    console.error(err);
  });
