const path = require('path');
const Promise = require('bluebird');
const appendFile = Promise.promisify(require('fs').appendFile);
const exec = Promise.promisify(require('child_process').exec);

const rooms_csv_absolute_path = path.join(__dirname, '../csvs/rooms.csv');
const fields = ['room_id', 'nightly_rate', 'person_capacity', 'tax'];
const command = `psql -U postgres -d airbnb -c "\\copy rooms (${fields}) FROM '${rooms_csv_absolute_path}' DELIMITER ',' CSV HEADER;"`;
const exec_time_init = Date.now();

exec(command)
  .then((stdout) => {
    // statistics
    const exec_time_final = Date.now();
    const execute_time_delta = Math.abs(exec_time_final - exec_time_init) / 1000;
    const date = new Date().toDateString();
    const time_o_clock = new Date(exec_time_final).toTimeString();
    const statistics = `Command: ${command}\nDate: ${date}\nTime: ${time_o_clock}\nExecution Time: ${execute_time_delta} seconds\nOutput: \n\t${stdout}\n`;
    
    // output results to terminal
    console.log(stdout);

    // create log file
    const log_file = path.join(__dirname, './seed-log/rooms.log');

    // write statistics to log file
    appendFile(log_file, statistics, 'utf8')
      .then(() => console.log('Done'))
      .catch(console.error);

  })
  .catch(console.error);
