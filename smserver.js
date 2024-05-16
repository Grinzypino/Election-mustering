const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

const PORT = process.env.PORT || 8000;

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://electionbackend:ePwDnqXF3GNzmwCc@election.ptaluj8.mongodb.net/?retryWrites=true&w=majority&appName=election';


// Define a schema for officer data
const officerSchema = new mongoose.Schema({
  officerNum: String,
  officerName: String,
  current_location: String,
  earlier_location: String
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
  if (req.method === 'POST' && req.url === '/saveOfficer') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse JSON data
      const officerData = JSON.parse(body);
      console.log('Received officer data:', officerData);

      // Ensure officerNum and current_location are strings
      const officerNum = String(officerData.officerNum);
      const current_location = String(officerData.current_location.coordinates);

      // Find the existing officer document for the selected officer
       Officer.findOne({ officerNum: officerNum })
        .then((existingOfficer) => {
          if (existingOfficer) {
            // Update the existing document with new current_location
            console.log(existingOfficer.current_location);
            existingOfficer.current_location = current_location;
             return existingOfficer.save()
              .then(() => {
                console.log('current location data updated');
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Location data updated');
              });
          } else {
            // No existing document found, create a new one
            const newLocation = new Location({
              PSnum: PSnum,
              current_location: current_location
            });
            return newLocation.save();
          }
        })
        .catch((err) => {
          console.error('Error updating location data:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        });
    });
  } else if (req.url === '/' || req.url === '/index.html') {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    fs.readFile("./public/index.html", (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === '/dashboard') {
    // Serve dashboard.html
    const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
    fs.readFile(dashboardPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.url === '/getPSLocations') {
    // Fetch all PS locations
    Location.find({})
      .then((locations) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(locations));
      })
      .catch((err) => {
        console.error('Error fetching PS locations:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
  }else if(req.url === '/dashboard2') {
    // Retrieve all documents from the PSLocations collection
    Location.find({})
      .then((locations) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(locations, null, 2));
      })
      .catch((err) => {
        console.error('Error fetching PS locations:', err);
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
