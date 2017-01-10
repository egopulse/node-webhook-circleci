const http = require('http');
const url = require('url');
const fs = require('fs');
const jsonBody = require('body/json');
const spawn = require('child_process').spawn;
require('shelljs/global');

const {CIRCLECI_WEBHOOK_PORT = 9001, CIRCLECI_WEBHOOK_COMMAND = './sample.sh'} = process.env;

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    return res.end("Invalid METHOD");
  }

  jsonBody(req, res, (err, json) => {
    if (err) {
      res.statusCode = 400;
      return res.end("Invalid JSON body");
    }

    const {outcome, vcs_revision, build_num} = json;
    
    res.statusCode = 400;
    if (!outcome || outcome === '') return res.end("Invalid status");
    if (outcome !== 'success') return res.end("Ignored build status");
    if (!vcs_revision || vcs_revision === '') return res.end("Invalid revision hash");
    if (!build_num || build_num === '') return res.end("Invalid build number");

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: `Acknowledged circle ci build ${build_num} of revision ${vcs_revision}`}));
    delegate(json);
  });
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(CIRCLECI_WEBHOOK_PORT);

const delegate = (json) => {
  echo(JSON.stringify(json)).exec(CIRCLECI_WEBHOOK_COMMAND, {async:true});
}