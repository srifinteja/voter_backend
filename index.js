const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { Parser } = require('json2csv');


const cors = require('cors'); // Import the cors module
const app = express();


const PORT = 3000;
const currentTimestamp = new Date().toISOString(); 
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  user: 'srifin_admin',
  host: '192.168.80.38',
  database: 'srifin',
  password: '7730061615',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10, // Limit the number of concurrent connections
  queueLimit: 0 // Unlimited queue size for connections
});

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

// API endpoint to fetch all rows and return as CSV
app.get('/api/employee/download', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customer_kyc_details');
    
    // Convert JSON to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(rows);
    
    // Set headers to prompt download
    res.header('Content-Type', 'text/csv');
    res.attachment('customer_kyc_details.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});
app.get('/api/employee/:id/exists', async (req, res) => {
  const employeeId = req.params.id;
// console.log(employeeId);
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM customer_kyc_details WHERE custmer_id = ?', [employeeId]);
    const exists = rows[0].count > 0; // Check if count is greater than 0
    // console.log(exists);
    res.json(exists);
  } catch (error) {
    console.error('Error checking customer ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/employee/:id/comment', async (req, res) => {
  console.log('Request body:', req.body);

  const { employeeId, branch, selfKyc, spouseKyc, generalComment } = req.body;

  // Check if employeeId is defined
  if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
  }

  // Create a single record combining selfKyc and spouseKyc details
  const selfRemark = selfKyc.comment || generalComment; // Self remarks
  const spouseRemark = spouseKyc.comment || generalComment; // Spouse remarks

  // Determine the KYC status for Self
  let selfKycStatus = selfKyc.isTrue ? 'Good KYC' : selfKyc.isFalse ? 'Fake KYC' : selfKyc.noHit ? 'No HIT' : '';
  
  // Determine the KYC status for Spouse
  let spouseKycStatus = spouseKyc.isTrue ? 'Good KYC' : spouseKyc.isFalse ? 'Fake KYC' : spouseKyc.noHit ? 'No HIT' : '';

  // Prepare the SQL insert statement
  const query = `
      INSERT INTO customer_kyc_details (custmer_id, selfkyc, spousekyc, remarks_self, remarks_spouse, branch)
        VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
      employeeId,
      selfKycStatus,
      spouseKycStatus,
      selfRemark,
      spouseRemark,
      branch,
  ];

  try {
      // Execute the SQL query
      await pool.query(query, values);
      res.json({ message: 'Comment and selections saved', employeeId, selfRemark, spouseRemark });
  } catch (error) {
      console.error('Error saving comment and selections:', error);
      res.status(500).json({ error: 'Error saving comment and selections' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

