
import express from 'express';
import bodyParser from 'body-parser';
import contactRoutes from "./routes/contact.js"
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());  // To parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', contactRoutes);  // Make sure to use the correct path

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});