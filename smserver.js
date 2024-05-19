const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

const PORT = process.env.PORT || 8000;

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://electionbackend:ePwDnqXF3GNzmwCc@election.ptaluj8.mongodb.net/?retryWrites=true&w=majority&appName=election';

// Define a schema for officer data
const psSchema = new mongoose.Schema({
  acPS: String,
  numPS: String,
  namePSe: String,
});

// Create a Mongoose model from the schema
const ac386ps = mongoose.model('ac386ps', psSchema);

// Define a schema for officer data
const officerSchema = new mongoose.Schema({
  officerNum: String,
  current_location: String,
  before30mins_location: String,
  earlier_locations: Array,
  isTime: Number
});

// Create a Mongoose model from the schema
const Officer = mongoose.model('officerLocations', officerSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/updateValues') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse JSON data
      const officerData = JSON.parse(body);
      console.log('Received officer data:', officerData);

      // Ensure officerNum and current_location are strings
      const roleValue= String(officerData.roleValue);
      const acValue= String(officerData.acValue);
      const psValue= String(officerData.psValue);
      const snoValue= String(officerData.snoValue);
      const znoValue= String(officerData.znoValue);
      const current_location = String(officerData.current_location.coordinates);
      // const officerNum = roleValue + acValue + psValue + snoValue + znoValue;

      // Find the existing officer document for the selected officer
      
      { 
        var officerNum = "";
        if(roleValue === '2'){
          officerNum = roleValue + acValue + snoValue;
        }
        else if(roleValue === '3'){
          officerNum = roleValue + acValue + znoValue;
        }
       Officer.findOne({ officerNum: officerNum })
        .then((existingOfficer) => {
          if (existingOfficer) {
            // Update the existing document 
            console.log(existingOfficer.current_location);
            existingOfficer.current_location = current_location;
            if(existingOfficer.isTime == 30){
              existingOfficer.earlier_locations.push(current_location);
              existingOfficer.before30mins_location = existingOfficer.earlier_locations.shift();
            }else{
              existingOfficer.isTime += 1;
              existingOfficer.earlier_locations.push(current_location);
              existingOfficer.before30mins_location = existingOfficer.earlier_locations[0];
            }
             return existingOfficer.save()
              .then(() => {
                console.log('current location data updated');
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Location data updated');
              });
          } else {
            // No existing document found, create a new one
            const newOfficer = new Officer({
              officerNum: officerNum,
              current_location: current_location,
              before30mins_location: current_location,
              earlier_locations: [current_location],
              isTime: 0
            });
            return newOfficer.save();
          }
        })
        .catch((err) => {
          console.error('Error updating location data:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        });
      }
    });
  } else if (req.url === '/' || req.url === '/masterindex.html') {
    const masterindexPath = path.join(__dirname, 'public', 'masterindex.html');
    fs.readFile(masterindexPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === '/smdashboard') {
    // Serve smdashboard.html
    const smdashboardPath = path.join(__dirname, 'public', 'smdashboard.html');
    fs.readFile(smdashboardPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === '/getSMLocations') {
    // Fetch all officers
    Officer.find({})
      .then((allofficers) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(allofficers));
      })
      .catch((err) => {
        console.error('Error fetching all officers data:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
  } else if(req.url === '/smdashboard2') {
    // Retrieve all documents from the officers collection
    Officer.find({})
      .then((allofficer) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(allofficer, null, 2));
      })
      .catch((err) => {
        console.error('Error fetching all officer data:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
  }else if(req.url === '/ac386ps') {
    // Retrieve all documents from the pslocations collection
    ac386ps.find({})
      .then((allps) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(allps, null, 2));
      })
      .catch((err) => {
        console.error('Error fetching all ps of ac 386:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
    }

   else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
