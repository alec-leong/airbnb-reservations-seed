const path = require('path');
const Promise = require('bluebird');
const appendFile = Promise.promisify(require('fs').appendFile);
const exec = require('child_process').exec;
// const exec = Promise.promisify(require('child_process').exec);

const rooms_csv_absolute_path = path.join(__dirname, '../csvs/rooms.csv');
const fields = ['room_id', 'nightly_rate', 'person_capacity', 'tax'];
const command = `mongoimport --type csv -d airbnb -c rooms --headerline --drop --file "${rooms_csv_absolute_path}"`;

console.log(command)

const seed = async () => {
  const promise = new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => { // stderr is actuall stdout
      if (error) {
        reject(error);
      } 

      console.log(stderr);
      resolve(stderr);
    });
  });

  const results = await promise;
  const lines = results.split('\n');
  const output = `\n${results}`.replace(/\n/g, '\n\t');

  const exec_time_init = new Date(lines[0].slice(0, lines[0].indexOf('\t')));
  const exec_time_final = new Date(lines[lines.length - 2].slice(0, lines[lines.length - 2].indexOf('\t')));
  const exec_time_delta = Math.abs(exec_time_final.valueOf() - exec_time_init.valueOf()) * 10 ** -3;
  
  const date = new Date().toDateString();
  const time_o_clock = new Date(exec_time_final).toTimeString();
  const statistics = `Command: ${command}
Date: ${date}
Time: ${time_o_clock}
Execution Time: ${exec_time_delta} seconds
Output:
${output}
\n\n\n\n`;
  
    // create log file
    const log_file = path.join(__dirname, './seed-log/rooms.nosql.log');

    // write statistics to log file
    appendFile(log_file, statistics, 'utf8')
      .then(() => console.log(`\n\n\n\nExecution Time: ${exec_time_delta} seconds\n\nDone`))
      .catch(console.error);
};

try {
  seed();
} catch(err) {
  console.error(err);
}

// exec(command)
//   .then((stdout) => {
//     // statistics
//     const exec_time_final = Date.now();
//     const execute_time_delta = Math.abs(exec_time_final - exec_time_init) / 1000;
//     const date = new Date().toDateString();
//     const time_o_clock = new Date(exec_time_final).toTimeString();
//     const statistics = `Command: ${command}\nDate: ${date}\nTime: ${time_o_clock}\nExecution Time: ${execute_time_delta} seconds\nOutput: \n\t${stdout}\n`;
    
//     // output results to terminal
//     console.log(stdout);

//     // create log file
//     const log_file = path.join(__dirname, './seed-log/rooms.nosql.log');

//     // write statistics to log file
//     appendFile(log_file, statistics, 'utf8')
//       .then(() => console.log(`${statistics}Done`))
//       .catch(console.error);

//   })
//   .catch(console.error);
