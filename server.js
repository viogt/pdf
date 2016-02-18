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
    
    if(req.url.charAt(0) == '/') returnFile('.'+req.url,res); //index.html', res);
    else {
        try {
            var x = JSON.parse(decodeURI(req.url.substr(1)));
            res.end('GET Action: ' + x.action + ' --- ' + JSON.stringify(x));
        } catch(e) { }
    }
    return;

  }
    body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () { saveFile('./res/tables.json',body, res); });
  
}).listen(port, ipaddress);

function returnFile(fl, resp){
    fs.readFile(fl, function (err,data) {
      //if (err) return shucher(resp, err);
      resp.writeHead(200, {'Content-Type': 'text/html' });
      resp.end(data);
    });
}

function saveFile( fl, bd, resp ){
	fs.writeFile(fl, bd, function(err) {
	  if (err) {
		  resp.writeHead(200, {'Content-Type': 'text/plain' });
		  resp.end('Error writing the file.'); return;
	  }
	  resp.writeHead(200, {'Content-Type': 'text/plain' });
	  resp.end('OK');
  });
}