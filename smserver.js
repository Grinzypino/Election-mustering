const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://electionbackend:ePwDnqXF3GNzmwCc@election.ptaluj8.mongodb.net/?retryWrites=true&w=majority&appName=election';

// Schema for Polling Station Data
const psSchema = new mongoose.Schema({
  acPS: String,
  numPS: String,
  namePSh: String,
  latPS: Number,
  longPS: Number
});

// Create Mongoose models for polling stations
const ac384ps = mongoose.model('ac384ps', psSchema);
const ac385ps = mongoose.model('ac385ps', psSchema);
const ac386ps = mongoose.model('ac386ps', psSchema);
const ac387ps = mongoose.model('ac387ps', psSchema);
const ac388ps = mongoose.model('ac388ps', psSchema);
const ac389ps = mongoose.model('ac389ps', psSchema);
const ac390ps = mongoose.model('ac390ps', psSchema);
const ac391ps = mongoose.model('ac391ps', psSchema);

// Schema for Officer Data
const officerSchema = new mongoose.Schema({
  officerNum: String,
  current_location: String,
  before30mins_location: String,
  earlier_locations: Array,
  isTime: Number,
  lastUpdated: { type: Date, default: Date.now },
  ps_location: String
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

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/updateValues', (req, res) => {
  const officerData = req.body;

  console.log('Received officer data:', officerData);

  const roleValue = String(officerData.roleValue);
  const acValue = String(officerData.acValue);
  const psValue = String(officerData.psValue);
  const snoValue = String(officerData.snoValue);
  const znoValue = String(officerData.znoValue);
  const current_location = String(officerData.current_location.coordinates);
  const ps_location = String(officerData.ps_location.coordinates);

  let officerNum = "";
  if (roleValue === '2') {
    officerNum = roleValue + acValue + snoValue;
  } else if (roleValue === '3') {
    officerNum = roleValue + acValue + znoValue;
  } else if (roleValue === '1') {
    officerNum = roleValue + acValue + psValue;
  }

  Officer.findOne({ officerNum: officerNum })
    .then((existingOfficer) => {
      if (existingOfficer) {
        existingOfficer.current_location = current_location;

        if (roleValue === '1') {
          const PSdistance = calculateDistance(ps_location, current_location);
          if (PSdistance > 500) {
            if (existingOfficer.isTime == 30) {
              existingOfficer.earlier_locations.push(current_location);
              existingOfficer.before30mins_location = existingOfficer.earlier_locations.shift();
            } else {
              existingOfficer.isTime += 5;
              existingOfficer.earlier_locations.push(current_location);
              existingOfficer.before30mins_location = existingOfficer.earlier_locations[0];
            }
          }
        } else if (existingOfficer.isTime == 30) {
          existingOfficer.earlier_locations.push(current_location);
          existingOfficer.before30mins_location = existingOfficer.earlier_locations.shift();
        } else {
          existingOfficer.isTime += 5;
          existingOfficer.earlier_locations.push(current_location);
          existingOfficer.before30mins_location = existingOfficer.earlier_locations[0];
        }

        return existingOfficer.save()
          .then(() => {
            console.log('current location data updated');
            res.status(200).send('Location data updated');
          });
      } else {
        const newOfficer = new Officer({
          officerNum: officerNum,
          current_location: current_location,
          before30mins_location: current_location,
          earlier_locations: [current_location],
          isTime: 0,
          ps_location: ps_location
        });
        return newOfficer.save()
          .then(() => {
            res.status(200).send('Location data saved');
          });
      }
    })
    .catch((err) => {
      console.error('Error updating location data:', err);
      res.status(500).send('Internal Server Error');
    });
});

// Serve HTML files with error handling
const serveHtmlFile = (filePath, res) => {
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error serving file ${filePath}:`, err);
      res.status(500).send('Internal Server Error');
    }
  });
};

app.get('/', (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public', 'masterindex.html'), res);
});

app.get('/smdashboard', (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public', 'smdashboard.html'), res);
});

app.get('/trackerDashboard', (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public', 'trackerDashboard.html'), res);
});

app.get('/disabledTrackers', (req, res) => {
  const fourMinutesAgo = Date.now() - 240000; // 4 minutes in milliseconds
  Officer.find({ lastUpdated: { $lt: fourMinutesAgo } })
    .then(disabledOfficers => {
      console.log("Disabled Officers:", disabledOfficers);
      res.status(200).json(disabledOfficers);
    })
    .catch(err => {
      console.error('Error fetching disabled officers data:', err);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/smdashboard2', (req, res) => {
  Officer.find({})
    .then((allOfficers) => {
      console.log("All Officers:", allOfficers);
      res.status(200).json(allOfficers);
    })
    .catch((err) => {
      console.error('Error fetching all officers data:', err);
      res.status(500).send('Internal Server Error');
    });
});

// Fetch all documents for each AC
const fetchAllPSDocuments = (model, res) => {
  model.find({})
    .then((allps) => {
      res.status(200).json(allps);
    })
    .catch((err) => {
      console.error(`Error fetching all ps of model ${model.modelName}:`, err);
      res.status(500).send('Internal Server Error');
    });
};

app.get('/ac384ps', (req, res) => {
  fetchAllPSDocuments(ac384ps, res);
});

app.get('/ac385ps', (req, res) => {
  fetchAllPSDocuments(ac385ps, res);
});

app.get('/ac386ps', (req, res) => {
  fetchAllPSDocuments(ac386ps, res);
});

app.get('/ac387ps', (req, res) => {
  fetchAllPSDocuments(ac387ps, res);
});

app.get('/ac388ps', (req, res) => {
  fetchAllPSDocuments(ac388ps, res);
});

app.get('/ac389ps', (req, res) => {
  fetchAllPSDocuments(ac389ps, res);
});

app.get('/ac390ps', (req, res) => {
  fetchAllPSDocuments(ac390ps, res);
});

app.get('/ac391ps', (req, res) => {
  fetchAllPSDocuments(ac391ps, res);
});

// Interval check for officers who haven't updated their location in the last 4 minutes
setInterval(() => {
  const fourMinutesAgo = Date.now() - 240000; // 240000 ms = 4 minutes
  Officer.find({})
    .then((allOfficers) => {
      allOfficers.forEach(officer => {
        if (new Date(officer.lastUpdated).getTime() < fourMinutesAgo) {
          console.log(`Officer ${officer.officerNum} has not updated location since ${officer.lastUpdated}. Location update may be disabled.`);
        }
      });
    })
    .catch((err) => {
      console.error('Error fetching all officer data:', err);
    });
}, 240000); // 4 minutes in milliseconds

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
