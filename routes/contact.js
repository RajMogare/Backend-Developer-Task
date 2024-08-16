
import express from "express";
import axios from "axios";
import db from "../config/db.js";
import dotenv from "dotenv";
import twilio from "twilio";
dotenv.config();

const router = express.Router();

// Task1

// create contact method

router.post('/createContact',async (req, res) => {
    const { first_name, last_name, email, mobile_number, data_store } = req.body;
    if (data_store === 'DATABASE') {
        const query = `INSERT INTO contacts (first_name, last_name, email, mobile_number) VALUES (?, ?, ?, ?)`;
        db.query(query, [first_name, last_name, email, mobile_number], (err, results) => {
            if (err) {
                console.error('Error inserting data into the database:', err);
                return res.status(500).json({ message: 'Error creating contact in database' });
            }
            res.status(201).json({ message: 'Contact created in Database', contactId: results.insertId });
        });
    } else if (data_store === 'CRM') {
        // CRM logic here...
        const response = await axios.post(`https://${process.env.FRESHSALES_DOMAIN}/contacts`, 
                            {
                                contact: { first_name, last_name, email, mobile_number }
                            },
                            { headers: { 'Authorization': `Token token=${process.env.FRESHSALES_API_KEY}` } }
                        );
                        res.status(201).json({ message: 'Contact created in CRM', data: response.data });
    } else {
        res.status(400).json({ message: 'Invalid data_store value' });
    }
});


// get contact method 
router.get('/getContacts', (req, res) => {
    
    const query = `SELECT * FROM contacts`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving data from the database:', err);
            return res.status(500).json({ message: 'Error retrieving contacts from database' });
        }
        res.status(200).json({ contacts: results });
    });
});


//get contact method for specific id 
router.get('/getContacts/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }

    // Retrieve specific contact from the MySQL database
    const query = `SELECT * FROM contacts WHERE id = ?`;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error retrieving data from the database:', err);
            return res.status(500).json({ message: 'Error retrieving contact from database' });
        }
        if (results.length > 0) {
            res.status(200).json({ contact: results[0] });
        } else {
            res.status(404).json({ message: 'Contact not found in database' });
        }
    });
});


// update method 

router.put('/updateContacts/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, mobile_number } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }

    // Prepare fields to update
    const fieldsToUpdate = [];
    const values = [];

    if (first_name) {
        fieldsToUpdate.push('first_name = ?');
        values.push(first_name);
    }
    if (last_name) {
        fieldsToUpdate.push('last_name = ?');
        values.push(last_name);
    }
    if (email) {
        fieldsToUpdate.push('email = ?');
        values.push(email);
    }
    if (mobile_number) {
        fieldsToUpdate.push('mobile_number = ?');
        values.push(mobile_number);
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'At least one field is required to update' });
    }

    // Construct the SQL query
    const query = `UPDATE contacts SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    values.push(id); 

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error updating data in the database:', err);
            return res.status(500).json({ message: 'Error updating contact in database' });
        }
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'Contact updated in Database' });
        } else {
            res.status(404).json({ message: 'Contact not found in database' });
        }
    });
});

// delete method

router.delete('/deleteContacts/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }

    // SQL query to delete the contact
    const query = `DELETE FROM contacts WHERE id = ?`;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting data from the database:', err);
            return res.status(500).json({ message: 'Error deleting contact from database' });
        }
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'Contact deleted from Database' });
        } else {
            res.status(404).json({ message: 'Contact not found in database' });
        }
    });
});


// Task 2

const accountSid =process.env.ACCOUNTSID; // Replace with your Twilio Account SID
const authToken = process.env.AUTHTOKEN; // Replace with your Twilio Auth Token
const client = twilio(accountSid, authToken);

router.post('/makeCall', (req, res) => {
    const { to } = req.body;

    client.calls.create({
        to: to,
        from: process.env.TWILLMOBILENUMBER, // Replace with your Twilio phone number
        url: 'https://abcd1234.ngrok.io/twiml' // URL that provides the TwiML
    })
    .then(call => res.send(`Call initiated with SID: ${call.sid}`))
    .catch(err => res.status(500).send(err.message));
});

// TwiML endpoint that provides the response instructions
router.post('/twiml', (req, res) => {
    res.type('text/xml');
    res.send(`
        <Response>
            <Say>Welcome! Press 1 to receive your interview link.</Say>
            <Gather action="/handleResponse" method="POST">
                <Say>Press 1 now.</Say>
            </Gather>
        </Response>
    `);
});

router.post('/handleResponse', (req, res) => {
    const digits = req.body.Digits;

    if (digits === '1') {
        // Send a follow-up SMS or email with the interview link
        client.messages.create({
            body: 'Here is your personalized interview link: [https://www.youtube.com/]',
            from: process.env.TWILLMOBILENUMBER, // Replace with your Twilio phone number
            to: req.body.From
        })
        .then(message => res.send(`Message sent with SID: ${message.sid}`))
        .catch(err => res.status(500).send(err.message));
    } else {
        res.send(`
            <Response>
                <Say>You did not press 1. Goodbye.</Say>
            </Response>
        `);
    }
});


export default router;
