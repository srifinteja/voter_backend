const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { createObjectCsvWriter } = require('csv-writer'); // Adjusted import statement

const cors = require('cors'); // Import the cors module
const app = express();


const PORT = 3000;


app.use(bodyParser.json());
// Serve static files from the uploads directory
// const uploadsDir = path.join('G:/My Drive/Risk/Voter_Images/RE-QC October/B123-Khadda');
const parentDir = path.join('G:/My Drive/Risk/Voter_Images/RE-QC October');
// app.use('/uploads', express.static(uploadsDir)); // Serve static files
// app.use('/uploads', express.static(path.join(__dirname, '../Desktop/s'))); // Serve images from the 'uploads' folder
// Use CORS middleware
app.use(cors({
  origin: '*', // Allow access from your Angular app and local IP
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Endpoint to fetch images for a given employee
app.get('/api/employee/:id/images', (req, res) => {
  const employeeId = req.params.id;
  // const folderName = req.query.folderName;
  const folder = req.query.folder; 
  // console.log("main "+folderName);
  const uploadsDir = path.join(`G:/My Drive/Risk/Voter_Images/RE-QC October/${folder}`);

  // Read the files from the uploads directory
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading images:', err);
      return res.status(500).send('Error reading images');
    }
    const uploadsDir = path.join(`G:/My Drive/Risk/Voter_Images/RE-QC October/${folder}`);
    app.use('/uploads', express.static(uploadsDir));
    // Filter files based on employee ID
    const images = files
      .filter(file => file.startsWith(employeeId)) // Only include files that start with the employee ID
      .map(file => ({
        name: file,
        link: `http://192.168.80.42:3000/uploads/${file}`, // Link to access the image
      }));

    if (images.length === 0) {
      return res.status(404).send('No images found for this employee');
    }

    res.json(images);
  });
});

app.get('/api/subfolders', (req, res) => {
  fs.readdir(parentDir, { withFileTypes: true }, (err, files) => {
      if (err) {
          console.error('Error reading directory:', err);
          return res.status(500).json({ error: 'Failed to read directory' });
      }

      // Filter to get only directories
      const subfolders = files
          .filter(file => file.isDirectory())
          .map(folder => folder.name); // Get the folder names

      res.json(subfolders);
  });
});



// Endpoint to get all unique employee IDs
app.get('/api/employee/ids', (req, res) => {
  // const folderName = req.query.folderName;
  const folder = req.query.folder; 
  // console.log("ids "+folderName);
  // if (!folderName) {
  //   return res.status(400).send('folderName is required');
  // }
  
  const uploadsDir = path.join(`G:/My Drive/Risk/Voter_Images/RE-QC October/${folder}`);

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading images:', err);
      return res.status(500).send('Error reading employee IDs');
    }

    // Extract unique employee IDs from filenames
    const employeeIds = Array.from(new Set(files.map(file => file.split('_')[0])));
    console.log(employeeIds);
    res.json(employeeIds);
  });
});

app.get('/api/csv', (req, res) => {
  res.sendFile(path.join("G:\\My Drive\\Risk\\Voter_Images\\Customer-QC-details.csv"));
});
// Endpoint to save comments to a CSV file
app.post('/api/employee/:id/comment', (req, res) => {
  console.log('Request body:', req.body);

  const { employeeId, selfKyc, spouseKyc, generalComment } = req.body;

  // Check if employeeId is defined
  if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
  }
// "G:\My Drive\Risk\Voter_Images\employee-comments.csv"
  const csvFilePath = path.join("G:\\My Drive\\Risk\\Voter_Images\\Customer-QC-details.csv");


  // Create a single record combining selfKyc and spouseKyc details
  const selfRemark = selfKyc.comment || generalComment; // Self remarks
  const spouseRemark = spouseKyc.comment || generalComment; // Spouse remarks
  const record = {
      employeeId: employeeId,
      selfKyc: selfKyc.isTrue ? 'Good KYC' : 'Fake KYC', // KYC type for Self
      spouseKyc: spouseKyc.isTrue ? 'Good KYC' : 'Fake KYC', // KYC type for Spouse
      selfRemark: selfRemark,
      spouseRemark: spouseRemark
  };

  // Check if the CSV file exists
  const fileExists = fs.existsSync(csvFilePath);

  // Write headers if the file does not exist
  if (!fileExists) {
      const headerWriter = createObjectCsvWriter({
          path: csvFilePath,
          header: [
              { id: 'employeeId', title: 'Employee ID' },
              { id: 'selfKyc', title: 'Self KYC' },
              { id: 'spouseKyc', title: 'Spouse KYC' },
              { id: 'selfRemark', title: 'Self Remark' },
              { id: 'spouseRemark', title: 'Spouse Remark' },
          ],
          append: false, // Do not append when creating
      });

      // Write the headers to the CSV file
      headerWriter.writeRecords([]) // Write an empty array to create the headers
          .then(() => {
              // After writing headers, now append the record
              const csvWriter = createObjectCsvWriter({
                  path: csvFilePath,
                  header: [
                      { id: 'employeeId', title: 'Employee ID' },
                      { id: 'selfKyc', title: 'Self KYC' },
                      { id: 'spouseKyc', title: 'Spouse KYC' },
                      { id: 'selfRemark', title: 'Self Remark' },
                      { id: 'spouseRemark', title: 'Spouse Remark' },
                  ],
                  append: true, // Now we can append data
              });

              // Write the record
              return csvWriter.writeRecords([record]);
          })
          .then(() => {
              res.json({ message: 'Comment and selections saved', employeeId, selfRemark, spouseRemark });
          })
          .catch(error => {
              console.error('Error writing to CSV:', error);
              res.status(500).json({ error: 'Error saving comment and selections' });
          });
  } else {
      // Append the record if the file already exists
      const csvWriter = createObjectCsvWriter({
          path: csvFilePath,
          header: [
              { id: 'employeeId', title: 'Employee ID' },
              { id: 'selfKyc', title: 'Self KYC' },
              { id: 'spouseKyc', title: 'Spouse KYC' },
              { id: 'selfRemark', title: 'Self Remark' },
              { id: 'spouseRemark', title: 'Spouse Remark' },
          ],
          append: true,
      });

      // Write the record to CSV
      csvWriter.writeRecords([record])
          .then(() => {
              res.json({ message: 'Comment and selections saved', employeeId, selfRemark, spouseRemark });
          })
          .catch(error => {
              console.error('Error writing to CSV:', error);
              res.status(500).json({ error: 'Error saving comment and selections' });
          });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

