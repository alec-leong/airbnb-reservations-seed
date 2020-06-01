const exec = require('child_process').exec;
const fs = require('fs')
const path = require('path');
const Promise = require('bluebird');

// global counter to compute sum of execution times in seconds
let sum_execution_times = 0;

// global counter to compute sum of file sizes in GB
let sum_file_sizes = 0;

const logger = (command, results, exec_time_init, exec_time_final) => {
  const output = `\n${results}`.replace(/\n/g, '\n\t\t');
  const execute_time_delta = Math.abs(exec_time_final - exec_time_init) * 10 ** -3;
  sum_execution_times += execute_time_delta;
  const statistics = `
\tCommand: ${command}
\tExecution Time: ${execute_time_delta} seconds
\tOutput:
${output}
\n`;

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
Total File Size: ${total_file_size_in_gb.toFixed(3)} GB
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
    let drop = i === 1 ? '--drop ' : '';
    let reservations_csv_absolute_path = path.join(__dirname, `../csvs/reservations${i}.csv`);
    let command =  `mongoimport --type csv -d airbnb -c reservations --headerline ${drop}--file "${reservations_csv_absolute_path}"`;;
    sum_file_sizes += fs.statSync(reservations_csv_absolute_path).size;

    console.log(command);

    let promise = new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => { // stderr is actuall stdout
        err ? reject(err) : resolve(stderr);
      });
    });

    let results = await promise;
    let lines = results.split('\n');

    let exec_time_init = new Date(lines[0].slice(0, lines[0].indexOf('\t'))).valueOf();
    exec_time_final = new Date(lines[lines.length - 2].slice(0, lines[lines.length - 2].indexOf('\t'))).valueOf();

    // concat logs
    logs += logger(command, results, exec_time_init, exec_time_final);
    
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
