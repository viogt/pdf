var http  = require('http'),
    fs    = require('fs'),
    Mng   = require('mongodb'),
    MngIp = 'mongodb://127.0.0.1:27017/test',
    body;

MngIp = 'mongodb://'+process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
	process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
	process.env.OPENSHIFT_APP_NAME;

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

http.createServer(function (req, res) {

  if(req.method == 'GET') {
    
    if(req.url == '/') returnFile('./index.html', res);
    else res.end('GET RETURN: ' + decodeURI(req.url));
    return;

  }
    body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
        try {
            var J = JSON.parse(body);
            res.end('POST RETURN: ' + JSON.stringify(J));
        } catch(e) { }
    });
  
}).listen(port, ipaddress);

function returnFile(fl, resp){
    fs.readFile(fl, function (err,data) {
      //if (err) return shucher(resp, err);
      resp.writeHead(200, {'Content-Type': 'text/html' });
      resp.end(data);
    });
}