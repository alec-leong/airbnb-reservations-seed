const path = require('path');
const Promise = require('bluebird');
const appendFile = Promise.promisify(require('fs').appendFile);
const exec = Promise.promisify(require('child_process').exec);

const command = 'psql -U postgres -f db/sql/schema/postgres.schema.sql';
const start = Date.now();

exec(command)
  .then((stdout) => {
    // log statistics
    const stop = Date.now();
    const elapsed = Math.abs(stop - start) / 1000;
    const day = new Date().toDateString();
    const time = new Date(stop).toTimeString();
    const lines = stdout.replace(/\r/g, '').split('\n').reduce((accum, value) => {
      accum += value !== '' ? `\t${value}\n` : ''; 
      return accum;
    }, '');
    const message = `Command: ${command}\nDate: ${day}\nTime: ${time}\nExecution Time: ${elapsed} seconds\nOutput: \n${lines}\n`;
    
    // log results to terminal
    console.log(stdout);

    // log results to log file
    const log_file = path.join(__dirname, './seed-log/airbnb.log');

    appendFile(log_file, message, 'utf8')
      .then(() => console.log('Done'))
      .catch(console.error);

  })
  .catch(console.error);
