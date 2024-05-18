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
  current_location: String,
  is30: Number,
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

const officerNum = '123';
const current_location = '123.777, 789.012';

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
        });
    } else {
    // No existing document found, create a new one
    const newOfficer = new Officer({
        officerNum: officerNum,
        current_location: current_location
    });
    return newOfficer.save();
    }
})
.catch((err) => {
    console.error('Error updating location data:', err);
});