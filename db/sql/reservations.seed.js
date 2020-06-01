const exec = require('child_process').exec;
const fs = require('fs')
const path = require('path');
const Promise = require('bluebird');

// global counter to compute sum of execution times in seconds
let sum_execution_times = 0;

// global counter to compute sum of file sizes in GB
let sum_file_sizes = 0;

const logger = (command, stdout, exec_time_init, exec_time_final) => {
  const execute_time_delta = Math.abs(exec_time_final - exec_time_init) / 1000;
  sum_execution_times += execute_time_delta;
  const statistics = `
\tCommand: ${command}
\tExecution Time: ${execute_time_delta} seconds
\tOutput:\n\t\t${stdout}`;

  return statistics;
};

const log_to_file = (logs, exec_time_final) => {
  // statistics
  const date = new Date().toDateString();
  const time_o_clock = new Date(exec_time_final).toTimeString();
  const total_file_size_in_gb = sum_file_sizes * 10 ** -9;
  const speed = total_file_size_in_gb / sum_execution_times;
  const statistics = `Commands:
${logs}
Date: ${date}
Time: ${time_o_clock}
Total File Size: ${total_file_size_in_gb} GB
Total Execution Time: ${sum_execution_times.toFixed(3)} seconds
Speed: ${speed.toFixed(3)} GB/s
\n\n\n\n\n`;
  // create log file
  const log_file = path.join(__dirname, './seed-log/reservations.log');
  const encoding = 'utf8';

  // write statistics to log file
  fs.appendFile(log_file, statistics, encoding, (err) => {
    if (err) {
      throw err;
    }
    
    console.log(`${statistics}Done`)
  });

};

const seed = async () => {
  const fields = ['reservation_id', 'room_id', 'check_in', 'check_out', 'cost'];
  const num_partitions = 10;
  
  let logs = '';
  let exec_time_final;

  for (let i = 1; i <= num_partitions; i++) {
    let reservations_csv_absolute_path = path.join(__dirname, `../csvs/reservations${i}.csv`);
    let command = `psql -U postgres -d airbnb -c "\\copy reservations (${fields}) FROM '${reservations_csv_absolute_path}' DELIMITER ',' CSV HEADER;"`;
    sum_file_sizes += fs.statSync(reservations_csv_absolute_path).size;

    console.log(command);

    let exec_time_init = Date.now();

    let promise = new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        exec_time_final = Date.now();
        
        if (err) {
          reject(err);
        }
        
        // concat logs
        logs += logger(command, stdout, exec_time_init, exec_time_final);
        
        // resolve
        resolve(stdout);
      });
    });

    let results = await promise;

    // output results to terminal
    console.log(results);  
  }

  log_to_file(logs, exec_time_final);

};

try {
  seed();
} catch(err) {
  console.error(err);
}
